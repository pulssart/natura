const PRINTFUL_API_BASE = "https://api.printful.com/v2";
const DEFAULT_STORE_ID = "18132950";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const allowedRoutes = [
  /^\/oauth-scopes$/,
  /^\/stores$/,
  /^\/stores\/\d+$/,
];

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
    body: JSON.stringify(body),
  };
}

function getRoutePath(eventPath) {
  const markers = [
    "/.netlify/functions/printful-v2",
    "/api/printful-v2",
  ];

  const marker = markers.find((prefix) => eventPath.startsWith(prefix));
  const routePath = marker ? eventPath.slice(marker.length) : eventPath;

  return routePath || "/oauth-scopes";
}

function getHeader(headers, name) {
  const target = name.toLowerCase();
  const entry = Object.entries(headers || {}).find(([key]) => key.toLowerCase() === target);

  return entry?.[1];
}

function parseMultipart(event) {
  const contentType = getHeader(event.headers, "content-type") || "";
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);

  if (!match) {
    throw new Error("Missing multipart boundary");
  }

  const boundary = match[1] || match[2];
  const body = Buffer.from(event.body || "", event.isBase64Encoded ? "base64" : "utf8");
  const delimiter = Buffer.from(`--${boundary}`);
  const fields = {};
  const files = {};
  let cursor = 0;

  while (cursor < body.length) {
    const start = body.indexOf(delimiter, cursor);
    if (start === -1) break;

    let partStart = start + delimiter.length;
    if (body.slice(partStart, partStart + 2).toString() === "--") break;
    if (body.slice(partStart, partStart + 2).toString() === "\r\n") partStart += 2;

    const next = body.indexOf(delimiter, partStart);
    if (next === -1) break;

    let part = body.slice(partStart, next);
    if (part.slice(-2).toString() === "\r\n") part = part.slice(0, -2);

    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) {
      cursor = next;
      continue;
    }

    const rawHeaders = part.slice(0, headerEnd).toString("utf8");
    const content = part.slice(headerEnd + 4);
    const name = rawHeaders.match(/name="([^"]+)"/)?.[1];
    if (!name) {
      cursor = next;
      continue;
    }

    const filename = rawHeaders.match(/filename="([^"]*)"/)?.[1];
    const fileContentType = rawHeaders.match(/content-type:\s*([^\r\n]+)/i)?.[1] || "application/octet-stream";

    if (filename !== undefined) {
      files[name] = { filename, contentType: fileContentType, data: content };
    } else {
      fields[name] = content.toString("utf8");
    }

    cursor = next;
  }

  return { fields, files };
}

function requireField(fields, name) {
  const value = fields[name]?.trim();
  if (!value) {
    throw new Error(`Missing field: ${name}`);
  }

  return value;
}

function printfulHeaders() {
  const token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    throw new Error("PRINTFUL_TOKEN is not configured");
  }

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-PF-Store-Id": process.env.PRINTFUL_STORE_ID || DEFAULT_STORE_ID,
  };
}

async function uploadPrintFile(image) {
  const form = new FormData();
  const file = new Blob([image.data], { type: image.contentType });

  form.append("file", file, image.filename || "natura-print.jpg");

  const response = await fetch("https://tmpfiles.org/api/v1/upload", {
    method: "POST",
    body: form,
  });
  const payload = await response.json().catch(() => null);
  const pageUrl = payload?.data?.url;

  if (!response.ok || payload?.status !== "success" || !pageUrl) {
    throw new Error("Print file upload failed");
  }

  return pageUrl.replace("http://tmpfiles.org/", "https://tmpfiles.org/dl/");
}

async function createPrintfulDraftOrder(event) {
  const headers = printfulHeaders();
  const { fields, files } = parseMultipart(event);
  const image = files.image;

  if (!image?.data?.length) {
    return json(400, { error: "Missing image" });
  }

  const catalogVariantId = Number.parseInt(requireField(fields, "printfulVariantId"), 10);
  if (!Number.isInteger(catalogVariantId)) {
    return json(400, { error: "Invalid Printful variant" });
  }

  const printfulPlacement = fields.printfulPlacement?.trim() || "default";
  const fileUrl = await uploadPrintFile(image);
  const creationName = requireField(fields, "creationName");

  const payload = {
    external_id: `natura-${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`,
    shipping: "STANDARD",
    recipient: {
      name: requireField(fields, "recipientName"),
      address1: requireField(fields, "addressLine1"),
      address2: fields.addressLine2?.trim() || undefined,
      city: requireField(fields, "city"),
      country_code: requireField(fields, "countryCode"),
      zip: requireField(fields, "postalCode"),
    },
    order_items: [
      {
        source: "catalog",
        catalog_variant_id: catalogVariantId,
        quantity: 1,
        name: creationName,
        placements: [
          {
            placement: printfulPlacement,
            technique: "digital",
            layers: [
              {
                type: "file",
                url: fileUrl,
              },
            ],
          },
        ],
      },
    ],
  };

  const response = await fetch(`${PRINTFUL_API_BASE}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const text = await response.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }

  if (!response.ok) {
    return json(response.status, {
      error: "Printful order creation failed",
      printful: parsed,
    });
  }

  const order = parsed?.data || parsed;
  const orderId = order?.id || order?.order_id;
  const dashboardUrl = order?.dashboard_url || (
    orderId
      ? `https://www.printful.com/dashboard?order_id=${orderId}`
      : "https://www.printful.com/dashboard"
  );

  return json(200, {
    checkoutUrl: dashboardUrl,
    dashboardUrl,
    orderId,
    status: order?.status || "draft",
  });
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  const routePath = getRoutePath(event.path);

  try {
    if (event.httpMethod === "POST" && routePath === "/print/checkout") {
      return await createPrintfulDraftOrder(event);
    }

    if (event.httpMethod !== "GET") {
      return json(405, { error: "Method not allowed" });
    }
  } catch (error) {
    return json(500, { error: error.message || "Server error" });
  }

  if (!allowedRoutes.some((route) => route.test(routePath))) {
    return json(404, { error: "Printful route not exposed" });
  }

  const token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    return json(500, { error: "PRINTFUL_TOKEN is not configured" });
  }

  const url = new URL(`${PRINTFUL_API_BASE}${routePath}`);
  for (const [key, value] of Object.entries(event.queryStringParameters || {})) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  const text = await response.text();

  return {
    statusCode: response.status,
    headers: {
      ...corsHeaders,
      "Content-Type": response.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
    body: text,
  };
}

const PRINTFUL_API_BASE = "https://api.printful.com/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
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

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders, body: "" };
  }

  if (event.httpMethod !== "GET") {
    return json(405, { error: "Method not allowed" });
  }

  const token = process.env.PRINTFUL_TOKEN;
  if (!token) {
    return json(500, { error: "PRINTFUL_TOKEN is not configured" });
  }

  const routePath = getRoutePath(event.path);
  if (!allowedRoutes.some((route) => route.test(routePath))) {
    return json(404, { error: "Printful route not exposed" });
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

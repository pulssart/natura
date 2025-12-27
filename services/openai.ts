import { AnalysisResult } from '../types';
import { OPENAI_API_BASE, GPT_5_2_MODEL, GPT_IMAGE_1_5_MODEL } from '../utils/constants';
import { getApiKey } from './storage';

const isWeb = typeof window !== 'undefined';

// Analyser une photo ou un texte avec GPT-5.2
export const analyzeInput = async (
  imageUri?: string,
  textDescription?: string
): Promise<AnalysisResult> => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Clé API OpenAI non configurée. Veuillez la définir dans les réglages.');
  }

  const messages: any[] = [
    {
      role: 'system',
      content: `Tu es un expert botaniste. Analyse la photo ou la description fournie et identifie l'espèce (plante, insecte ou animal). 
      Réponds UNIQUEMENT avec un JSON valide contenant:
      - "type": "plant" | "insect" | "animal"
      - "commonName": le nom commun en français
      - "scientificName": le nom scientifique (format: Genre espèce)
      - "characteristics": les caractéristiques principales
      - "description": une courte description (2-3 phrases) pour la légende`,
    },
  ];

  if (imageUri) {
    // Convertir l'image en base64 pour l'API
    const base64Image = await imageToBase64(imageUri);
    messages.push({
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:image/jpeg;base64,${base64Image}`,
          },
        },
        {
          type: 'text',
          text: 'Identifie cette espèce et fournis les informations demandées.',
        },
      ],
    });
  } else if (textDescription) {
    messages.push({
      role: 'user',
      content: `Identifie l'espèce décrite: "${textDescription}" et fournis les informations demandées.`,
    });
  } else {
    throw new Error('Aucune image ou description fournie');
  }

  const response = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GPT_5_2_MODEL,
      messages,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erreur lors de l\'analyse');
  }

  const data = await response.json();
  const content = JSON.parse(data.choices[0].message.content);
  
  return {
    type: content.type,
    commonName: content.commonName,
    scientificName: content.scientificName,
    characteristics: content.characteristics,
    description: content.description,
  };
};

// Générer une illustration botanique avec GPT Image 1.5
export const generateBotanicalIllustration = async (
  analysis: AnalysisResult
): Promise<string> => {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('Clé API OpenAI non configurée.');
  }

  const prompt = `Illustration botanique scientifique au crayon et crayon de couleur, style botaniste classique, très détaillée et précise, représentant ${analysis.commonName} (${analysis.scientificName}). 
  Style: dessin naturaliste au crayon graphite avec touches de couleur au crayon de couleur, fond blanc, format A4 portrait, haute qualité, prêt pour l'impression. 
  Caractéristiques à représenter: ${analysis.characteristics}`;

  // GPT Image 1.5 - paramètres de base
  // Tailles supportées: 1024x1024, 1024x1536, 1536x1024, ou "auto"
  const requestBody: any = {
    model: GPT_IMAGE_1_5_MODEL,
    prompt,
    size: 'auto', // Le modèle choisit automatiquement la meilleure taille
  };

  const response = await fetch(`${OPENAI_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `Erreur ${response.status}: ${response.statusText}`;
    console.error('Erreur API OpenAI:', errorData);
    console.error('Requête envoyée:', JSON.stringify(requestBody, null, 2));
    throw new Error(errorMessage);
  }

  const data = await response.json();
  console.log('Réponse API OpenAI (génération image) - clés:', Object.keys(data));
  
  // GPT Image 1.5 peut retourner soit une URL, soit du base64
  let imageResult: string | undefined;
  
  if (data.data && data.data[0]) {
    const imageData = data.data[0];
    
    // Cas 1: L'API retourne une URL
    if (imageData.url) {
      imageResult = imageData.url;
      console.log('Image reçue sous forme d\'URL');
    }
    // Cas 2: L'API retourne du base64 (b64_json)
    else if (imageData.b64_json) {
      // Convertir le base64 en data URL pour l'affichage
      imageResult = `data:image/png;base64,${imageData.b64_json}`;
      console.log('Image reçue sous forme de base64, longueur:', imageData.b64_json.length);
    }
  } else if (data.url) {
    imageResult = data.url;
  } else if (data.b64_json) {
    imageResult = `data:image/png;base64,${data.b64_json}`;
  }
  
  if (!imageResult) {
    console.error('Format de réponse inattendu:', data);
    throw new Error('Format de réponse inattendu de l\'API');
  }
  
  // Vérifier que c'est bien une URL HTTP valide ou une image base64
  if (!imageResult.startsWith('http://') && !imageResult.startsWith('https://') && !imageResult.startsWith('data:image/')) {
    console.error('Format d\'image invalide retourné par l\'API:', imageResult.substring(0, 100));
    throw new Error('Format d\'image invalide retourné par l\'API');
  }
  
  console.log('Image générée avec succès, type:', imageResult.startsWith('data:') ? 'base64' : 'URL');
  return imageResult;
};

// Convertir une image locale en base64
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    if (isWeb) {
      // Sur le web, utiliser FileReader
      if (uri.startsWith('data:')) {
        // Déjà en base64, extraire la partie base64
        return uri.split(',')[1];
      }
      // Sinon, charger l'image et la convertir
      const response = await fetch(uri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Sur mobile, utiliser expo-file-system
      const FileSystem = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    }
  } catch (error) {
    throw new Error('Erreur lors de la conversion de l\'image en base64');
  }
};


import { AnalysisResult } from '../types';
import { OPENAI_API_BASE, GPT_5_2_MODEL, GPT_IMAGE_1_5_MODEL, A4_WIDTH, A4_HEIGHT } from '../utils/constants';
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

  const response = await fetch(`${OPENAI_API_BASE}/images/generations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GPT_IMAGE_1_5_MODEL,
      prompt,
      n: 1,
      size: `${A4_WIDTH}x${A4_HEIGHT}`,
      quality: 'hd',
      response_format: 'url',
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Erreur lors de la génération de l\'image');
  }

  const data = await response.json();
  return data.data[0].url;
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


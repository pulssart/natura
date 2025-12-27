import { BotanicalCreation } from '../types';
import { STORAGE_KEY_CREATIONS, STORAGE_KEY_API_KEY } from '../utils/constants';

// Détecter si on est sur le web
const isWeb = typeof window !== 'undefined';

// Convertir une URL d'image en base64 pour le stockage web
const imageUrlToBase64 = async (url: string): Promise<string> => {
  if (isWeb) {
    try {
      // Vérifier si c'est déjà en base64
      if (url.startsWith('data:image/')) {
        return url;
      }
      
      // Vérifier si c'est une URL valide d'image
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        console.warn('URL invalide, utilisation directe:', url);
        return url;
      }
      
      const response = await fetch(url);
      
      // Vérifier que c'est bien une image
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.error('La réponse n\'est pas une image, content-type:', contentType);
        // Si ce n'est pas une image, on garde l'URL originale
        return url;
      }
      
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Vérifier que le résultat est bien une image en base64
          if (result.startsWith('data:image/')) {
            resolve(result);
          } else {
            console.error('Le résultat n\'est pas une image base64:', result.substring(0, 100));
            resolve(url); // Fallback sur l'URL originale
          }
        };
        reader.onerror = () => {
          console.error('Erreur FileReader');
          resolve(url); // Fallback sur l'URL originale
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return url; // Fallback sur l'URL originale
    }
  }
  return url;
};

// Sauvegarder une création
export const saveCreation = async (creation: Omit<BotanicalCreation, 'id' | 'createdAt'>): Promise<BotanicalCreation> => {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  
  // Sur le web, on garde l'URL originale (les URLs OpenAI sont accessibles)
  // La conversion en base64 peut échouer si l'URL nécessite des en-têtes spéciaux
  let imageUri = creation.imageUri;
  
  // Si c'est déjà en base64, on le garde tel quel
  if (isWeb && !imageUri.startsWith('data:image/') && imageUri.startsWith('http')) {
    // Pour les URLs HTTP, on les garde telles quelles
    // Les URLs OpenAI devraient être accessibles depuis le navigateur
    console.log('Conservation de l\'URL originale pour le web:', imageUri.substring(0, 50) + '...');
  }
  
  const fullCreation: BotanicalCreation = {
    ...creation,
    id,
    imageUri,
    createdAt,
  };
  
  // Sauvegarder dans localStorage (web) ou AsyncStorage (mobile)
  const creations = await getCreations();
  creations.push(fullCreation);
  
  if (isWeb) {
    localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(creations));
    console.log('Création sauvegardée dans localStorage, total:', creations.length);
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(creations));
  }
  
  return fullCreation;
};

// Récupérer toutes les créations
export const getCreations = async (): Promise<BotanicalCreation[]> => {
  try {
    if (isWeb) {
      const data = localStorage.getItem(STORAGE_KEY_CREATIONS);
      if (!data) {
        console.log('Aucune donnée dans localStorage');
        return [];
      }
      const creations = JSON.parse(data);
      console.log('Créations récupérées depuis localStorage:', creations.length);
      return creations;
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(STORAGE_KEY_CREATIONS);
      if (!data) return [];
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error getting creations:', error);
    return [];
  }
};

// Supprimer une création
export const deleteCreation = async (id: string): Promise<void> => {
  const creations = await getCreations();
  const filtered = creations.filter(c => c.id !== id);
  
  if (isWeb) {
    localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(filtered));
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(filtered));
  }
};

// Obtenir la clé API
export const getApiKey = async (): Promise<string | null> => {
  if (isWeb) {
    return localStorage.getItem(STORAGE_KEY_API_KEY);
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
  }
};

// Sauvegarder la clé API
export const saveApiKey = async (apiKey: string): Promise<void> => {
  if (isWeb) {
    localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  }
};


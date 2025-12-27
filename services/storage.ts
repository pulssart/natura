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
  
  // Valider que l'URL est valide
  if (!imageUri) {
    throw new Error('imageUri est requis pour sauvegarder une création');
  }
  
  // Vérifier que ce n'est pas du HTML
  if (imageUri.startsWith('data:text/html')) {
    console.error('Tentative de sauvegarder une URL HTML invalide:', imageUri.substring(0, 100));
    throw new Error('URL d\'image invalide: ne peut pas être du HTML');
  }
  
  // Vérifier que c'est une URL HTTP/HTTPS valide ou une image base64
  const isValidUrl = 
    imageUri.startsWith('http://') || 
    imageUri.startsWith('https://') ||
    imageUri.startsWith('data:image/');
  
  if (!isValidUrl) {
    console.error('URL invalide:', imageUri.substring(0, 100));
    throw new Error('URL d\'image invalide: doit être une URL HTTP/HTTPS ou une image base64');
  }
  
  console.log('Sauvegarde d\'une création avec URL valide:', imageUri.substring(0, 50) + '...');
  
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

// Nettoyer les créations avec des URLs invalides
const cleanInvalidCreations = (creations: BotanicalCreation[]): BotanicalCreation[] => {
  return creations.filter(creation => {
    if (!creation.imageUri) {
      console.warn('Suppression d\'une création sans imageUri:', creation.id);
      return false;
    }
    
    // Supprimer les créations avec des URLs HTML au lieu d'images
    if (creation.imageUri.startsWith('data:text/html')) {
      console.warn('Suppression d\'une création avec URL HTML invalide:', creation.id);
      return false;
    }
    
    // Garder les URLs HTTP/HTTPS valides et les images base64 valides
    const isValidUrl = 
      creation.imageUri.startsWith('http://') || 
      creation.imageUri.startsWith('https://') ||
      creation.imageUri.startsWith('data:image/');
    
    if (!isValidUrl) {
      console.warn('Suppression d\'une création avec URL invalide:', creation.id, creation.imageUri.substring(0, 50));
      return false;
    }
    
    return true;
  });
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
      
      // Nettoyer les créations invalides
      const cleanedCreations = cleanInvalidCreations(creations);
      if (cleanedCreations.length !== creations.length) {
        console.log(`Nettoyage: ${creations.length - cleanedCreations.length} création(s) invalide(s) supprimée(s)`);
        // Sauvegarder les créations nettoyées
        localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(cleanedCreations));
      }
      
      return cleanedCreations;
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(STORAGE_KEY_CREATIONS);
      if (!data) return [];
      const creations = JSON.parse(data);
      const cleanedCreations = cleanInvalidCreations(creations);
      if (cleanedCreations.length !== creations.length) {
        await AsyncStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(cleanedCreations));
      }
      return cleanedCreations;
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

// Nettoyer toutes les créations invalides (utile pour corriger les données corrompues)
export const cleanAllInvalidCreations = async (): Promise<number> => {
  const creations = await getCreations();
  const beforeCount = creations.length;
  const cleaned = cleanInvalidCreations(creations);
  const removedCount = beforeCount - cleaned.length;
  
  if (removedCount > 0) {
    if (isWeb) {
      localStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(cleaned));
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(cleaned));
    }
  }
  
  return removedCount;
};


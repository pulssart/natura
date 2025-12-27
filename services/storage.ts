import { BotanicalCreation } from '../types';
import { STORAGE_KEY_CREATIONS, STORAGE_KEY_API_KEY } from '../utils/constants';

// Détecter si on est sur le web
const isWeb = typeof window !== 'undefined';

// Convertir une URL d'image en base64 pour le stockage web
const imageUrlToBase64 = async (url: string): Promise<string> => {
  if (isWeb) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
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
  
  // Sur le web, convertir l'image en base64 pour le stockage
  let imageUri = creation.imageUri;
  if (isWeb) {
    imageUri = await imageUrlToBase64(creation.imageUri);
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
      if (!data) return [];
      return JSON.parse(data);
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


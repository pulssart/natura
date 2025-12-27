import { BotanicalCreation } from '../types';
import { STORAGE_KEY_CREATIONS, STORAGE_KEY_API_KEY } from '../utils/constants';

// Détecter si on est sur le web
const isWeb = typeof window !== 'undefined';

// ============================================
// IndexedDB pour le web (stockage illimité)
// ============================================

const DB_NAME = 'NaturaDB';
const DB_VERSION = 1;
const STORE_CREATIONS = 'creations';
const STORE_SETTINGS = 'settings';

let dbPromise: Promise<IDBDatabase> | null = null;

// Ouvrir la base de données IndexedDB
const openDB = (): Promise<IDBDatabase> => {
  if (!isWeb) {
    return Promise.reject(new Error('IndexedDB n\'est pas disponible'));
  }
  
  if (dbPromise) {
    return dbPromise;
  }
  
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => {
      console.error('Erreur ouverture IndexedDB:', request.error);
      reject(request.error);
    };
    
    request.onsuccess = () => {
      console.log('IndexedDB ouverte avec succès');
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Créer le store pour les créations
      if (!db.objectStoreNames.contains(STORE_CREATIONS)) {
        const store = db.createObjectStore(STORE_CREATIONS, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        console.log('Store "creations" créé');
      }
      
      // Créer le store pour les paramètres (clé API, etc.)
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
        console.log('Store "settings" créé');
      }
    };
  });
  
  return dbPromise;
};

// Migration des données de localStorage vers IndexedDB
const migrateFromLocalStorage = async (): Promise<void> => {
  if (!isWeb) return;
  
  try {
    // Nettoyer le localStorage pour éviter les erreurs de quota
    // Les anciennes données corrompues seront supprimées
    const oldData = localStorage.getItem(STORAGE_KEY_CREATIONS);
    if (oldData) {
      try {
        const creations = JSON.parse(oldData);
        if (Array.isArray(creations) && creations.length > 0) {
          console.log(`Migration de ${creations.length} création(s) de localStorage vers IndexedDB...`);
          
          const db = await openDB();
          const transaction = db.transaction(STORE_CREATIONS, 'readwrite');
          const store = transaction.objectStore(STORE_CREATIONS);
          
          for (const creation of creations) {
            // Vérifier que la création est valide avant de migrer
            if (creation.imageUri && 
                (creation.imageUri.startsWith('data:image/') || 
                 creation.imageUri.startsWith('http://') || 
                 creation.imageUri.startsWith('https://'))) {
              store.put(creation);
            }
          }
          
          await new Promise<void>((resolve, reject) => {
            transaction.oncomplete = () => {
              console.log('Migration terminée');
              resolve();
            };
            transaction.onerror = () => reject(transaction.error);
          });
        }
      } catch (parseError) {
        console.error('Erreur parsing localStorage:', parseError);
      }
      
      // Toujours supprimer localStorage après migration (même si erreur)
      console.log('Suppression des anciennes données localStorage...');
      localStorage.removeItem(STORAGE_KEY_CREATIONS);
    }
    
    // Migrer la clé API aussi
    const oldApiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    if (oldApiKey) {
      await saveApiKey(oldApiKey);
      localStorage.removeItem(STORAGE_KEY_API_KEY);
      console.log('Clé API migrée vers IndexedDB');
    }
  } catch (error) {
    console.error('Erreur lors de la migration:', error);
    // En cas d'erreur, supprimer quand même localStorage pour éviter les problèmes de quota
    try {
      localStorage.removeItem(STORAGE_KEY_CREATIONS);
      localStorage.removeItem(STORAGE_KEY_API_KEY);
    } catch (e) {
      // Ignorer
    }
  }
};

// Initialiser IndexedDB et migrer les données
let migrationDone = false;
const ensureMigration = async (): Promise<void> => {
  if (!isWeb || migrationDone) return;
  migrationDone = true;
  await migrateFromLocalStorage();
};

// ============================================
// Fonctions de stockage
// ============================================

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

// Sauvegarder une création
export const saveCreation = async (creation: Omit<BotanicalCreation, 'id' | 'createdAt'>): Promise<BotanicalCreation> => {
  const id = Date.now().toString();
  const createdAt = new Date().toISOString();
  
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
  
  const fullCreation: BotanicalCreation = {
    ...creation,
    id,
    imageUri,
    createdAt,
  };
  
  if (isWeb) {
    await ensureMigration();
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CREATIONS, 'readwrite');
      const store = transaction.objectStore(STORE_CREATIONS);
      const request = store.add(fullCreation);
      
      request.onsuccess = () => {
        console.log('Création sauvegardée dans IndexedDB:', fullCreation.id);
        resolve(fullCreation);
      };
      request.onerror = () => {
        console.error('Erreur sauvegarde IndexedDB:', request.error);
        reject(request.error);
      };
    });
  } else {
    // Mobile: utiliser AsyncStorage
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const creations = await getCreations();
    creations.push(fullCreation);
    await AsyncStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(creations));
    return fullCreation;
  }
};

// Récupérer toutes les créations
export const getCreations = async (): Promise<BotanicalCreation[]> => {
  try {
    if (isWeb) {
      await ensureMigration();
      const db = await openDB();
      
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_CREATIONS, 'readonly');
        const store = transaction.objectStore(STORE_CREATIONS);
        const request = store.getAll();
        
        request.onsuccess = () => {
          const creations = request.result || [];
          console.log('Créations récupérées depuis IndexedDB:', creations.length);
          const cleanedCreations = cleanInvalidCreations(creations);
          resolve(cleanedCreations);
        };
        request.onerror = () => {
          console.error('Erreur lecture IndexedDB:', request.error);
          reject(request.error);
        };
      });
    } else {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const data = await AsyncStorage.getItem(STORAGE_KEY_CREATIONS);
      if (!data) return [];
      const creations = JSON.parse(data);
      return cleanInvalidCreations(creations);
    }
  } catch (error) {
    console.error('Error getting creations:', error);
    return [];
  }
};

// Supprimer une création
export const deleteCreation = async (id: string): Promise<void> => {
  console.log('deleteCreation appelé avec ID:', id, 'type:', typeof id);
  
  if (isWeb) {
    await ensureMigration();
    const db = await openDB();
    
    // S'assurer que l'ID est une string
    const idString = String(id);
    console.log('Suppression de IndexedDB avec ID (string):', idString);
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CREATIONS, 'readwrite');
      const store = transaction.objectStore(STORE_CREATIONS);
      
      // Vérifier d'abord si l'élément existe
      const checkRequest = store.get(idString);
      checkRequest.onsuccess = () => {
        if (checkRequest.result) {
          console.log('Élément trouvé, suppression...', checkRequest.result);
          const deleteRequest = store.delete(idString);
          deleteRequest.onsuccess = () => {
            console.log('Création supprimée de IndexedDB avec succès:', idString);
            resolve();
          };
          deleteRequest.onerror = () => {
            console.error('Erreur lors de la suppression IndexedDB:', deleteRequest.error);
            reject(deleteRequest.error);
          };
        } else {
          console.warn('Élément non trouvé dans IndexedDB avec ID:', idString);
          // Résoudre quand même car l'objectif (supprimer) est atteint
          resolve();
        }
      };
      checkRequest.onerror = () => {
        console.error('Erreur lors de la vérification IndexedDB:', checkRequest.error);
        reject(checkRequest.error);
      };
    });
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const creations = await getCreations();
    const filtered = creations.filter(c => c.id !== id);
    await AsyncStorage.setItem(STORAGE_KEY_CREATIONS, JSON.stringify(filtered));
  }
};

// Obtenir la clé API
export const getApiKey = async (): Promise<string | null> => {
  if (isWeb) {
    await ensureMigration();
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, 'readonly');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.get('apiKey');
      
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
      request.onerror = () => {
        console.error('Erreur lecture clé API:', request.error);
        reject(request.error);
      };
    });
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return await AsyncStorage.getItem(STORAGE_KEY_API_KEY);
  }
};

// Sauvegarder la clé API
export const saveApiKey = async (apiKey: string): Promise<void> => {
  if (isWeb) {
    await ensureMigration();
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORE_SETTINGS);
      const request = store.put({ key: 'apiKey', value: apiKey });
      
      request.onsuccess = () => {
        console.log('Clé API sauvegardée dans IndexedDB');
        resolve();
      };
      request.onerror = () => {
        console.error('Erreur sauvegarde clé API:', request.error);
        reject(request.error);
      };
    });
  } else {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  }
};

// Nettoyer toutes les créations invalides
export const cleanAllInvalidCreations = async (): Promise<number> => {
  const creations = await getCreations();
  const beforeCount = creations.length;
  const cleaned = cleanInvalidCreations(creations);
  const removedCount = beforeCount - cleaned.length;
  
  if (removedCount > 0 && isWeb) {
    const db = await openDB();
    const transaction = db.transaction(STORE_CREATIONS, 'readwrite');
    const store = transaction.objectStore(STORE_CREATIONS);
    
    // Supprimer toutes les créations invalides
    const allCreations = await getCreations();
    for (const creation of allCreations) {
      if (!cleaned.find(c => c.id === creation.id)) {
        store.delete(creation.id);
      }
    }
  }
  
  return removedCount;
};

// ============================================
// Export/Import des créations
// ============================================

// Convertir une image URL en base64
const imageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    if (imageUri.startsWith('data:image/')) {
      // Déjà en base64, retourner tel quel
      return imageUri;
    }
    
    if (isWeb) {
      // Sur le web, utiliser fetch
      const response = await fetch(imageUri);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } else {
      // Sur mobile, utiliser expo-file-system
      const FileSystem = require('expo-file-system');
      const base64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      // Déterminer le type MIME depuis l'extension
      const mimeType = imageUri.endsWith('.png') ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    }
  } catch (error) {
    console.error('Erreur conversion image en base64:', error);
    throw new Error('Impossible de convertir l\'image en base64');
  }
};

// Exporter toutes les créations dans un fichier JSON
export const exportCreations = async (): Promise<string> => {
  try {
    const creations = await getCreations();
    
    if (creations.length === 0) {
      throw new Error('Aucune création à exporter');
    }
    
    // Convertir toutes les images en base64
    const creationsWithBase64 = await Promise.all(
      creations.map(async (creation) => {
        const base64Image = await imageToBase64(creation.imageUri);
        return {
          ...creation,
          imageUri: base64Image, // Remplacer l'URL par le base64
        };
      })
    );
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      count: creationsWithBase64.length,
      creations: creationsWithBase64,
    };
    
    const jsonString = JSON.stringify(exportData, null, 2);
    
    if (isWeb) {
      // Sur le web, télécharger le fichier
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `natura-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return 'Export réussi';
    } else {
      // Sur mobile, utiliser expo-sharing
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');
      
      const filename = `natura-backup-${new Date().toISOString().split('T')[0]}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;
      
      await FileSystem.writeAsStringAsync(fileUri, jsonString);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'application/json',
          dialogTitle: 'Exporter les créations',
        });
      }
      
      return 'Export réussi';
    }
  } catch (error: any) {
    console.error('Erreur export:', error);
    throw new Error(error.message || 'Erreur lors de l\'export');
  }
};

// Importer des créations depuis un fichier JSON
export const importCreations = async (fileContent: string, replace: boolean = false): Promise<number> => {
  try {
    const data = JSON.parse(fileContent);
    
    // Valider la structure
    if (!data.creations || !Array.isArray(data.creations)) {
      throw new Error('Format de fichier invalide');
    }
    
    const importedCreations = data.creations;
    
    if (importedCreations.length === 0) {
      throw new Error('Le fichier ne contient aucune création');
    }
    
    // Si replace est true, supprimer toutes les créations existantes
    if (replace) {
      const existingCreations = await getCreations();
      for (const creation of existingCreations) {
        await deleteCreation(creation.id);
      }
    }
    
    // Importer les créations
    let importedCount = 0;
    for (const creationData of importedCreations) {
      try {
        // Valider que la création a les champs requis
        if (!creationData.imageUri || !creationData.commonName || !creationData.scientificName) {
          console.warn('Création invalide ignorée:', creationData);
          continue;
        }
        
        // Vérifier si l'image est en base64
        if (!creationData.imageUri.startsWith('data:image/')) {
          console.warn('Image non base64 ignorée:', creationData.id);
          continue;
        }
        
        // Créer une nouvelle création (nouvel ID et date)
        await saveCreation({
          imageUri: creationData.imageUri,
          commonName: creationData.commonName,
          scientificName: creationData.scientificName,
          description: creationData.description || '',
          type: creationData.type || 'plant',
        });
        
        importedCount++;
      } catch (error) {
        console.error('Erreur import création:', error);
        // Continuer avec les autres créations
      }
    }
    
    if (importedCount === 0) {
      throw new Error('Aucune création valide n\'a pu être importée');
    }
    
    return importedCount;
  } catch (error: any) {
    console.error('Erreur import:', error);
    if (error.message.includes('JSON')) {
      throw new Error('Fichier JSON invalide');
    }
    throw new Error(error.message || 'Erreur lors de l\'import');
  }
};

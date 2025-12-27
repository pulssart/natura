import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
const isWeb = typeof window !== 'undefined';

const { width, height } = Dimensions.get('window');

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const { id, imageUri, commonName, scientificName, description } = params;

  const handlePrint = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      let localUri = imageUri as string;
      
      if (isWeb) {
        // Sur le web, utiliser un iframe caché pour imprimer sans quitter la page
        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.top = '-9999px';
        printFrame.style.left = '-9999px';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        document.body.appendChild(printFrame);

        const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document;
        if (!printDocument) {
          Alert.alert('Erreur', 'Impossible de créer le document d\'impression');
          document.body.removeChild(printFrame);
          setLoading(false);
          return;
        }

        printDocument.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @page {
                  size: A4;
                  margin: 0;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                  font-family: 'Georgia', 'Times New Roman', serif;
                }
                .page {
                  width: 100%;
                  height: 100%;
                  display: flex;
                  flex-direction: column;
                  padding: 20px;
                }
                .image-container {
                  flex: 1;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  overflow: hidden;
                }
                .image-container img {
                  max-width: 100%;
                  max-height: 100%;
                  object-fit: contain;
                }
                .legend {
                  text-align: center;
                  padding: 20px 0 10px 0;
                  border-top: 1px solid #2d5016;
                  margin-top: 15px;
                }
                .common-name {
                  font-size: 24px;
                  font-weight: bold;
                  color: #2d5016;
                  margin-bottom: 5px;
                }
                .scientific-name {
                  font-size: 16px;
                  font-style: italic;
                  color: #666;
                }
              </style>
            </head>
            <body>
              <div class="page">
                <div class="image-container">
                  <img src="${localUri}" alt="${commonName}" />
                </div>
                <div class="legend">
                  <div class="common-name">${commonName}</div>
                  <div class="scientific-name">${scientificName}</div>
                </div>
              </div>
            </body>
          </html>
        `);
        printDocument.close();

        // Fonction pour lancer l'impression
        const doPrint = () => {
          try {
            printFrame.contentWindow?.print();
          } catch (e) {
            console.error('Erreur impression:', e);
          }
          // Nettoyer l'iframe après l'impression
          setTimeout(() => {
            try {
              document.body.removeChild(printFrame);
            } catch (e) {
              // Ignorer si déjà supprimé
            }
          }, 1000);
          setLoading(false);
        };

        // Attendre que l'image soit chargée avant d'imprimer
        const img = printDocument.querySelector('img');
        if (img) {
          // Pour les images base64, elles peuvent être déjà chargées
          if (img.complete && img.naturalHeight !== 0) {
            // Image déjà chargée
            setTimeout(doPrint, 100);
          } else {
            // Attendre le chargement
            img.onload = doPrint;
            img.onerror = () => {
              Alert.alert('Erreur', 'Impossible de charger l\'image pour l\'impression');
              document.body.removeChild(printFrame);
              setLoading(false);
            };
            // Timeout de sécurité au cas où onload ne se déclenche pas
            setTimeout(() => {
              if (img.complete || img.naturalHeight > 0) {
                doPrint();
              }
            }, 2000);
          }
        } else {
          doPrint();
        }
      } else {
        // Sur mobile, utiliser expo-print
        const Print = require('expo-print');
        const FileSystem = require('expo-file-system');
        
        if (imageUri.startsWith('http')) {
          const filename = `${id}.png`;
          const downloadPath = `${FileSystem.documentDirectory}${filename}`;
          const downloadResult = await FileSystem.downloadAsync(imageUri as string, downloadPath);
          localUri = downloadResult.uri;
        }

        const html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
                .image-container { width: 100%; text-align: center; margin-bottom: 20px; }
                .image-container img { max-width: 100%; height: auto; page-break-inside: avoid; }
                .legend { margin-top: 20px; padding: 20px; border-top: 2px solid #2d5016; }
                .common-name { font-size: 28px; font-weight: bold; color: #2d5016; margin-bottom: 8px; }
                .scientific-name { font-size: 18px; font-style: italic; color: #666; margin-bottom: 12px; }
                .description { font-size: 14px; color: #333; line-height: 1.6; }
              </style>
            </head>
            <body>
              <div class="image-container">
                <img src="${localUri}" alt="${commonName}" />
              </div>
              <div class="legend">
                <div class="common-name">${commonName}</div>
                <div class="scientific-name">${scientificName}</div>
                <div class="description">${description}</div>
              </div>
            </body>
          </html>
        `;

        await Print.printAsync({
          html,
          width: 595,
          height: 842,
        });
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible d\'imprimer l\'illustration');
      console.error('Print error:', error);
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!imageUri) return;

    setLoading(true);
    try {
      let localUri = imageUri as string;
      
      if (isWeb) {
        // Sur le web, utiliser Web Share API
        if (navigator.share) {
          try {
            // Télécharger l'image pour la partager
            const response = await fetch(localUri);
            const blob = await response.blob();
            const file = new File([blob], `${commonName}.png`, { type: 'image/png' });
            
            await navigator.share({
              title: commonName as string,
              text: `${commonName} (${scientificName})`,
              files: [file],
            });
          } catch (shareError: any) {
            if (shareError.name !== 'AbortError') {
              // Si l'utilisateur annule, ne pas afficher d'erreur
              // Sinon, fallback sur le téléchargement
              const link = document.createElement('a');
              link.href = localUri;
              link.download = `${commonName}.png`;
              link.click();
            }
          }
        } else {
          // Fallback : télécharger l'image
          const link = document.createElement('a');
          link.href = localUri;
          link.download = `${commonName}.png`;
          link.click();
        }
        setLoading(false);
      } else {
        // Sur mobile, utiliser expo-sharing
        const Sharing = require('expo-sharing');
        const FileSystem = require('expo-file-system');
        
        if (imageUri.startsWith('http')) {
          const filename = `${id}.png`;
          const downloadPath = `${FileSystem.documentDirectory}${filename}`;
          const downloadResult = await FileSystem.downloadAsync(imageUri as string, downloadPath);
          localUri = downloadResult.uri;
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(localUri, {
            mimeType: 'image/png',
            dialogTitle: `Partager ${commonName}`,
          });
        } else {
          Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
        }
        setLoading(false);
      }
    } catch (error: any) {
      Alert.alert('Erreur', 'Impossible de partager l\'illustration');
      console.error('Share error:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2d5016" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Illustration</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: imageUri as string }}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.legend}>
          <Text style={styles.commonName}>{commonName}</Text>
          <Text style={styles.scientificName}>{scientificName}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.printButton]}
          onPress={handlePrint}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="print" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Imprimer</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          disabled={loading}
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  scrollContent: {
    padding: 20,
  },
  imageContainer: {
    width: '100%',
    minHeight: 400,
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    minHeight: 400,
  },
  legend: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderTopWidth: 3,
    borderTopColor: '#2d5016',
  },
  commonName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 8,
  },
  scientificName: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  printButton: {
    backgroundColor: '#2d5016',
  },
  shareButton: {
    backgroundColor: '#4a7c2a',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});


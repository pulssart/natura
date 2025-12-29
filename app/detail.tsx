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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
const isWeb = Platform.OS === 'web';

const { width, height } = Dimensions.get('window');

export default function DetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);

  const { id, imageUri, commonName, scientificName, description } = params;
  
  // S'assurer que le nom commun est toujours présent
  const displayCommonName = (Array.isArray(commonName) ? commonName[0] : commonName) || 'Nom non disponible';
  const displayScientificName = (Array.isArray(scientificName) ? scientificName[0] : scientificName) || '';
  const displayDescription = (Array.isArray(description) ? description[0] : description) || '';
  const imageUriString = Array.isArray(imageUri) ? imageUri[0] : imageUri;

  // Fonction de retour améliorée
  const handleBack = () => {
    if (isWeb && typeof window !== 'undefined') {
      // Sur le web, vérifier s'il y a un historique
      if (window.history.length > 1) {
        router.back();
      } else {
        // Sinon, aller à la page d'accueil
        router.replace('/');
      }
    } else {
      router.back();
    }
  };

  // Fonction de téléchargement pour le web
  const downloadImage = async (uri: string, filename: string) => {
    try {
      // Créer un canvas pour convertir l'image
      const img = new (window as any).Image();
      img.crossOrigin = 'anonymous';
      
      return new Promise<void>((resolve, reject) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                resolve();
              } else {
                reject(new Error('Impossible de créer le blob'));
              }
            }, 'image/png');
          } else {
            reject(new Error('Impossible de créer le contexte canvas'));
          }
        };
        img.onerror = () => {
          // Fallback: téléchargement direct
          const link = document.createElement('a');
          link.href = uri;
          link.download = filename;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          resolve();
        };
        img.src = uri;
      });
    } catch (error) {
      // Fallback ultime
      const link = document.createElement('a');
      link.href = uri;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (!imageUriString) return;

    setLoading(true);
    try {
      let localUri = imageUriString as string;
      const filename = `${displayCommonName.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
      
      if (isWeb && typeof window !== 'undefined') {
        // Sur le web, essayer Web Share API d'abord, sinon télécharger
        const canShareFiles = navigator.canShare && navigator.canShare({ files: [new File([], 'test.png', { type: 'image/png' })] });
        
        if (navigator.share && canShareFiles) {
          try {
            // Télécharger l'image pour la partager
            const response = await fetch(localUri);
            const blob = await response.blob();
            const file = new File([blob], filename, { type: 'image/png' });
            
            await navigator.share({
              title: displayCommonName,
              text: displayScientificName ? `${displayCommonName} (${displayScientificName})` : displayCommonName,
              files: [file],
            });
          } catch (shareError: any) {
            if (shareError.name !== 'AbortError') {
              // Si l'utilisateur annule, ne pas afficher d'erreur
              // Sinon, fallback sur le téléchargement
              await downloadImage(localUri, filename);
            }
          }
        } else {
          // Fallback : télécharger l'image
          await downloadImage(localUri, filename);
        }
        setLoading(false);
      } else {
        // Sur mobile, utiliser expo-sharing
        const Sharing = require('expo-sharing');
        const FileSystem = require('expo-file-system');
        
        if (imageUriString && typeof imageUriString === 'string' && imageUriString.startsWith('http')) {
          const downloadFilename = `${id}.png`;
          const downloadPath = `${FileSystem.documentDirectory}${downloadFilename}`;
          const downloadResult = await FileSystem.downloadAsync(imageUriString, downloadPath);
          localUri = downloadResult.uri;
        }

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(localUri, {
            mimeType: 'image/png',
            dialogTitle: `Partager ${displayCommonName}`,
          });
        } else {
          Alert.alert('Erreur', 'Le partage n\'est pas disponible sur cet appareil');
        }
        setLoading(false);
      }
    } catch (error: any) {
      console.error('Share error:', error);
      if (isWeb) {
        alert('Impossible de partager l\'illustration');
      } else {
        Alert.alert('Erreur', 'Impossible de partager l\'illustration');
      }
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View pointerEvents="none" style={styles.backgroundAccent} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          {...(Platform.OS === 'web' && {
            // @ts-ignore - onClick est disponible sur le web
            onClick: (e: any) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              handleBack();
            },
          })}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2d5016" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Illustration</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.banner}>
        <Ionicons name="sparkles-outline" size={18} color="#1f3b16" />
        <Text style={styles.bannerText}>Découvre les détails de ton illustration générée</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{
              uri: imageUriString as string,
            }}
            style={styles.image}
            resizeMode="contain"
          />
          <View style={styles.imageBadge}>
            <Ionicons name="leaf-outline" size={16} color="#1f3b16" />
            <Text style={styles.imageBadgeText}>Prêt à partager</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendHeader}>
            <Text style={styles.legendKicker}>Fiche botanique</Text>
            <View style={styles.legendDivider} />
            <Ionicons name="ribbon-outline" size={18} color="#2E7D32" />
          </View>
          <Text style={styles.commonName}>{displayCommonName}</Text>
          {displayScientificName ? (
            <Text style={styles.scientificName}>{displayScientificName}</Text>
          ) : null}
          {displayDescription ? (
            <Text style={styles.description}>{displayDescription}</Text>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton]}
          onPress={handleShare}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="share-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Partager</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9', // Jaune-vert pâle lumineux
  },
  backgroundAccent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DDEFD5',
    transform: [{ skewY: '-5deg' }],
    top: -220,
    borderBottomLeftRadius: 160,
    borderBottomRightRadius: 160,
    opacity: 0.65,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(241, 248, 233, 0.8)',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1B5E20',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 18,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.1)',
  },
  bannerText: {
    fontSize: 14,
    color: '#2E7D32',
    fontWeight: '600',
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.75,
    backgroundColor: '#F1F8E9',
    marginBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  imageBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f3b16',
  },
  legend: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    borderTopWidth: 4,
    borderTopColor: '#4CAF50',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    marginHorizontal: 24,
  },
  legendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  legendKicker: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  legendDivider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
  },
  commonName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  scientificName: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#558B2F',
    marginBottom: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#1B5E20',
    lineHeight: 26,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(76, 175, 80, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


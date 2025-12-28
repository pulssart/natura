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
const isWeb = typeof window !== 'undefined';

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

  const handleShare = async () => {
    if (!imageUriString) return;

    setLoading(true);
    try {
      let localUri = imageUriString as string;
      
      if (isWeb) {
        // Sur le web, utiliser Web Share API
        if (navigator.share) {
          try {
            // Télécharger l'image pour la partager
            const response = await fetch(localUri);
            const blob = await response.blob();
            const file = new File([blob], `${displayCommonName}.png`, { type: 'image/png' });
            
            await navigator.share({
              title: displayCommonName,
              text: displayScientificName ? `${displayCommonName} (${displayScientificName})` : displayCommonName,
              files: [file],
            });
          } catch (shareError: any) {
            if (shareError.name !== 'AbortError') {
              // Si l'utilisateur annule, ne pas afficher d'erreur
              // Sinon, fallback sur le téléchargement
              const link = document.createElement('a');
              link.href = localUri;
              link.download = `${displayCommonName}.png`;
              link.click();
            }
          }
        } else {
          // Fallback : télécharger l'image
          const link = document.createElement('a');
          link.href = localUri;
          link.download = `${displayCommonName}.png`;
          link.click();
        }
        setLoading(false);
      } else {
        // Sur mobile, utiliser expo-sharing
        const Sharing = require('expo-sharing');
        const FileSystem = require('expo-file-system');
        
        if (imageUriString && typeof imageUriString === 'string' && imageUriString.startsWith('http')) {
          const filename = `${id}.png`;
          const downloadPath = `${FileSystem.documentDirectory}${filename}`;
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
      Alert.alert('Erreur', 'Impossible de partager l\'illustration');
      console.error('Share error:', error);
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={(e) => {
            // Empêcher la propagation sur le web
            if (Platform.OS === 'web' && e) {
              // @ts-ignore
              e.nativeEvent?.stopPropagation?.();
            }
            // Retour vers la page des favoris
            router.push('/favorites');
          }}
          {...(Platform.OS === 'web' && {
            // @ts-ignore - onClick est disponible sur le web
            onClick: (e: any) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              router.push('/favorites');
            },
          })}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#2d5016" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Illustration</Text>
        <View style={styles.placeholder} />
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
        </View>

        <View style={styles.legend}>
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
          onPress={(e) => {
            // Empêcher la propagation sur le web
            if (Platform.OS === 'web' && e) {
              // @ts-ignore
              e.nativeEvent?.stopPropagation?.();
            }
            handleShare();
          }}
          {...(Platform.OS === 'web' && {
            // @ts-ignore - onClick est disponible sur le web
            onClick: (e: any) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              handleShare();
            },
          })}
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
  scrollContent: {
    paddingBottom: 150,
    flexGrow: 1,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.75,
    backgroundColor: '#F1F8E9',
    marginBottom: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
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
    position: 'relative',
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


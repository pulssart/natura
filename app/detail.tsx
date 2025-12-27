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
        bounces={false}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ 
              uri: imageUri as string,
            }}
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
    backgroundColor: '#fafafa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  imageContainer: {
    width: '100%',
    height: height * 0.75, // 75% de la hauteur de l'écran pour un affichage plein écran
    backgroundColor: '#fafafa',
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
    backgroundColor: '#fff',
    borderRadius: 20,
    borderTopWidth: 4,
    borderTopColor: '#2d5016',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    marginHorizontal: 24,
  },
  commonName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2d5016',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  scientificName: {
    fontSize: 20,
    fontStyle: 'italic',
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 26,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
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
    borderRadius: 14,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButton: {
    backgroundColor: '#2d5016',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});


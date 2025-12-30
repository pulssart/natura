import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { analyzeInput, generateBotanicalIllustration } from '../../services/openai';
import { saveCreation } from '../../services/storage';
import ApiKeyModal from '../../components/ApiKeyModal';

export default function HomeScreen() {
  const router = useRouter();
  const [textDescription, setTextDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showApiModal, setShowApiModal] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        "L'application a besoin d'accéder à vos photos pour fonctionner."
      );
      return false;
    }
    return true;
  };

  const pickImage = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setTextDescription('');
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        "L'application a besoin d'accéder à la caméra pour fonctionner."
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setTextDescription('');
    }
  };

  const handleGenerate = async () => {
    if (!textDescription.trim() && !selectedImage) {
      Alert.alert('Erreur', 'Veuillez entrer une description ou sélectionner une photo');
      return;
    }

    setLoading(true);

    try {
      const analysis = await analyzeInput(selectedImage || undefined, textDescription || undefined);
      const imageUrl = await generateBotanicalIllustration(analysis);

      if (!analysis.commonName || analysis.commonName.trim() === '') {
        throw new Error('Le nom commun est obligatoire mais est manquant. Veuillez réessayer.');
      }

      await saveCreation({
        imageUri: imageUrl,
        commonName: analysis.commonName.trim(),
        scientificName: analysis.scientificName || '',
        description: analysis.description || '',
        type: analysis.type,
      });

      setTextDescription('');
      setSelectedImage(null);
      router.push('/favorites');

      setTimeout(() => {
        Alert.alert(
          'Succès',
          'Illustration botanique générée et sauvegardée avec succès !'
        );
      }, 500);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View pointerEvents="none" style={styles.backgroundAccent} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <TouchableOpacity onPress={() => setShowApiModal(true)} style={styles.iconButton}>
            <Ionicons name="settings-outline" size={22} color="#1f3b16" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Créez une illustration botanique</Text>
          <Text style={styles.description}>
            Décrivez votre sujet ou ajoutez une photo, puis lancez la génération.
          </Text>

          <TextInput
            style={styles.textInput}
            placeholder="Ex: Une fougère aux frondes lumineuses dans la rosée du matin..."
            value={textDescription}
            onChangeText={setTextDescription}
            multiline
            numberOfLines={4}
            editable={!loading && !selectedImage}
          />

          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.photoButton, selectedImage && styles.photoButtonActive]}
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="images-outline" size={22} color={selectedImage ? '#fff' : '#1f3b16'} />
              <Text style={[styles.photoButtonText, selectedImage && styles.photoButtonTextActive]}>
                Galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoButton, selectedImage && styles.photoButtonActive]}
              onPress={takePhoto}
              disabled={loading}
            >
              <Ionicons name="camera-outline" size={22} color={selectedImage ? '#fff' : '#1f3b16'} />
              <Text style={[styles.photoButtonText, selectedImage && styles.photoButtonTextActive]}>
                Photo
              </Text>
            </TouchableOpacity>
          </View>

          {selectedImage && (
            <View style={styles.imagePreview}>
              <Image source={{ uri: selectedImage }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={() => setSelectedImage(null)}
              >
                <Ionicons name="close-circle" size={24} color="#ff4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.generateButton,
              (loading || (!textDescription.trim() && !selectedImage)) && styles.generateButtonDisabled,
            ]}
            onPress={handleGenerate}
            disabled={loading || (!textDescription.trim() && !selectedImage)}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.generateButtonText}>Générer l'illustration</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ApiKeyModal visible={showApiModal} onClose={() => setShowApiModal(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  backgroundAccent: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#DDEFD5',
    transform: [{ skewY: '-6deg' }],
    top: -180,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 120,
    opacity: 0.6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 7,
    paddingRight: 31,
    paddingVertical: 2,
    height: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  logoContainer: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    height: 73,
    width: 168,
    textAlign: 'left',
  },
  logo: {
    height: 73,
    width: 173,
    paddingTop: 0,
    paddingBottom: 0,
    textAlign: 'left',
  },
  iconButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: '#558B2F',
    lineHeight: 24,
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 18,
    padding: 18,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#66BB6A',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    gap: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  photoButtonActive: {
    backgroundColor: '#4CAF50',
    borderColor: '#2E7D32',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2E7D32',
    letterSpacing: 0.2,
  },
  photoButtonTextActive: {
    color: '#fff',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  previewImage: {
    width: '100%',
    height: 220,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 16,
    gap: 10,
    marginTop: 12,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#BDBDBD',
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

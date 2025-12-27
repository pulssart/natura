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
        'L\'application a besoin d\'accéder à vos photos pour fonctionner.'
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
      setTextDescription(''); // Effacer le texte si une image est sélectionnée
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission requise',
        'L\'application a besoin d\'accéder à la caméra pour fonctionner.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
      setTextDescription(''); // Effacer le texte si une photo est prise
    }
  };

  const handleGenerate = async () => {
    if (!textDescription.trim() && !selectedImage) {
      Alert.alert('Erreur', 'Veuillez entrer une description ou sélectionner une photo');
      return;
    }

    setLoading(true);
    console.log('Début de la génération...');

    try {
      // Étape 1: Analyser avec GPT-5.2
      console.log('Étape 1: Analyse de l\'input...');
      const analysis = await analyzeInput(selectedImage || undefined, textDescription || undefined);
      console.log('Analyse terminée:', analysis);

      // Étape 2: Générer l'illustration avec GPT Image 1.5
      console.log('Étape 2: Génération de l\'illustration...');
      const imageUrl = await generateBotanicalIllustration(analysis);
      console.log('Illustration générée, URL:', imageUrl);

      // Étape 3: Sauvegarder la création
      console.log('Étape 3: Sauvegarde de la création...');
      const savedCreation = await saveCreation({
        imageUri: imageUrl,
        commonName: analysis.commonName,
        scientificName: analysis.scientificName,
        description: analysis.description,
        type: analysis.type,
      });
      console.log('Création sauvegardée:', savedCreation);

      // Réinitialiser le formulaire
      setTextDescription('');
      setSelectedImage(null);

      // Naviguer automatiquement vers les favoris
      console.log('Navigation vers les favoris...');
      // Dans Expo Router avec tabs, on peut naviguer directement vers le nom de l'écran
      // Utiliser le nom de l'écran sans le préfixe (tabs)
      router.push('/favorites');
      
      // Afficher une alerte de succès (non bloquante)
      setTimeout(() => {
        Alert.alert(
          'Succès',
          'Illustration botanique générée et sauvegardée avec succès !'
        );
      }, 500);
    } catch (error: any) {
      console.error('Erreur lors de la génération:', error);
      Alert.alert('Erreur', error.message || 'Une erreur est survenue lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Natura</Text>
          <TouchableOpacity onPress={() => setShowApiModal(true)}>
            <Ionicons name="settings-outline" size={24} color="#2d5016" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>Créez une illustration botanique</Text>
          <Text style={styles.description}>
            Entrez une description ou prenez une photo pour générer une illustration scientifique
          </Text>

          {/* Champ de saisie texte */}
          <TextInput
            style={styles.textInput}
            placeholder="Ex: Une fleur rouge avec des pétales pointus..."
            value={textDescription}
            onChangeText={setTextDescription}
            multiline
            numberOfLines={4}
            editable={!loading && !selectedImage}
          />

          {/* Boutons photo */}
          <View style={styles.photoButtons}>
            <TouchableOpacity
              style={[styles.photoButton, selectedImage && styles.photoButtonActive]}
              onPress={pickImage}
              disabled={loading}
            >
              <Ionicons name="images-outline" size={24} color={selectedImage ? "#fff" : "#2d5016"} />
              <Text style={[styles.photoButtonText, selectedImage && styles.photoButtonTextActive]}>
                Galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoButton, selectedImage && styles.photoButtonActive]}
              onPress={takePhoto}
              disabled={loading}
            >
              <Ionicons name="camera-outline" size={24} color={selectedImage ? "#fff" : "#2d5016"} />
              <Text style={[styles.photoButtonText, selectedImage && styles.photoButtonTextActive]}>
                Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Aperçu de l'image sélectionnée */}
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

          {/* Bouton générer */}
          <TouchableOpacity
            style={[
              styles.generateButton,
              (loading || (!textDescription.trim() && !selectedImage)) && styles.generateButtonDisabled
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
    backgroundColor: '#fafafa',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#2d5016',
    letterSpacing: -0.5,
  },
  content: {
    padding: 24,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 32,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    padding: 18,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
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
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#4a7c59',
    backgroundColor: '#fff',
    gap: 10,
    shadowColor: '#2d5016',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  photoButtonActive: {
    backgroundColor: '#2d5016',
    borderColor: '#2d5016',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
    letterSpacing: 0.2,
  },
  photoButtonTextActive: {
    color: '#fff',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
    backgroundColor: '#2d5016',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 10,
    marginTop: 12,
    shadowColor: '#2d5016',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  generateButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#a5a5a5',
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


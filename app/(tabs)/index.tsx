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

    try {
      // Étape 1: Analyser avec GPT-5.2
      const analysis = await analyzeInput(selectedImage || undefined, textDescription || undefined);

      // Étape 2: Générer l'illustration avec GPT Image 1.5
      const imageUrl = await generateBotanicalIllustration(analysis);

      // Étape 3: Sauvegarder la création
      await saveCreation({
        imageUri: imageUrl,
        commonName: analysis.commonName,
        scientificName: analysis.scientificName,
        description: analysis.description,
        type: analysis.type,
      });

      Alert.alert(
        'Succès',
        'Illustration botanique générée et sauvegardée avec succès !',
        [
          { 
            text: 'Voir les favoris', 
            onPress: () => {
              setTextDescription('');
              setSelectedImage(null);
              router.push('/favorites');
            }
          },
          { 
            text: 'OK', 
            onPress: () => {
              setTextDescription('');
              setSelectedImage(null);
            }
          }
        ]
      );
    } catch (error: any) {
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
            style={[styles.generateButton, loading && styles.generateButtonDisabled]}
            onPress={handleGenerate}
            disabled={loading}
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
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2d5016',
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2d5016',
    backgroundColor: '#fff',
    gap: 8,
  },
  photoButtonActive: {
    backgroundColor: '#2d5016',
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d5016',
  },
  photoButtonTextActive: {
    color: '#fff',
  },
  imagePreview: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2d5016',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});


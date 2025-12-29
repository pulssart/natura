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
      // Validation supplémentaire: s'assurer que le nom commun existe
      if (!analysis.commonName || analysis.commonName.trim() === '') {
        throw new Error('Le nom commun est obligatoire mais est manquant. Veuillez réessayer.');
      }
      const savedCreation = await saveCreation({
        imageUri: imageUrl,
        commonName: analysis.commonName.trim(),
        scientificName: analysis.scientificName || '',
        description: analysis.description || '',
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

        <View style={styles.heroCard}>
          <View style={styles.heroTextGroup}>
            <Text style={styles.kicker}>Assistant botanique</Text>
            <Text style={styles.heroTitle}>Composez des planches élégantes</Text>
            <Text style={styles.heroDescription}>
              Combinez l'analyse IA et vos photos pour générer des illustrations soignées, prêtes à partager.
            </Text>
            <View style={styles.heroPills}>
              <View style={styles.pill}>
                <Ionicons name="leaf-outline" size={16} color="#1f3b16" />
                <Text style={styles.pillText}>Botanique</Text>
              </View>
              <View style={styles.pill}>
                <Ionicons name="color-palette-outline" size={16} color="#1f3b16" />
                <Text style={styles.pillText}>Illustration</Text>
              </View>
              <View style={styles.pill}>
                <Ionicons name="sparkles-outline" size={16} color="#1f3b16" />
                <Text style={styles.pillText}>IA</Text>
              </View>
            </View>
          </View>

          <View style={styles.heroBadge}>
            <Ionicons name="time-outline" size={18} color="#1f3b16" />
            <Text style={styles.heroBadgeText}>En quelques étapes</Text>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.stepsCard}>
            <Text style={styles.stepsTitle}>Démarrez en douceur</Text>
            <View style={styles.stepsRow}>
              <View style={styles.stepItem}>
                <Ionicons name="text-outline" size={18} color="#2E7D32" />
                <Text style={styles.stepLabel}>Décrivez un sujet</Text>
              </View>
              <View style={styles.stepDivider} />
              <View style={styles.stepItem}>
                <Ionicons name="image-outline" size={18} color="#2E7D32" />
                <Text style={styles.stepLabel}>Ajoutez une photo</Text>
              </View>
              <View style={styles.stepDivider} />
              <View style={styles.stepItem}>
                <Ionicons name="sparkles-outline" size={18} color="#2E7D32" />
                <Text style={styles.stepLabel}>Lancez la magie</Text>
              </View>
            </View>
          </View>

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
              <Ionicons name="images-outline" size={22} color={selectedImage ? "#fff" : "#1f3b16"} />
              <Text style={[styles.photoButtonText, selectedImage && styles.photoButtonTextActive]}>
                Galerie
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.photoButton, selectedImage && styles.photoButtonActive]}
              onPress={takePhoto}
              disabled={loading}
            >
              <Ionicons name="camera-outline" size={22} color={selectedImage ? "#fff" : "#1f3b16"} />
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

          <View style={styles.helperCard}>
            <Ionicons name="bulb-outline" size={18} color="#1f3b16" />
            <View style={{ flex: 1 }}>
              <Text style={styles.helperTitle}>Astuces</Text>
              <Text style={styles.helperText}>
                Combinez une description précise (couleurs, texture, contexte) et une photo nette pour un rendu optimal.
              </Text>
            </View>
          </View>

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
    // Dégradé doux jaune-vert vers aqua-vert (comme l'icône)
    backgroundColor: '#F1F8E9', // Jaune-vert pâle lumineux
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Blanc légèrement transparent
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)', // Vert doux
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
  heroCard: {
    marginHorizontal: 20,
    marginTop: 20,
    padding: 22,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 6,
  },
  heroTextGroup: {
    gap: 10,
  },
  kicker: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1B5E20',
    letterSpacing: -0.3,
  },
  heroDescription: {
    fontSize: 15,
    color: '#3C5B2F',
    lineHeight: 22,
  },
  heroPills: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(237, 247, 227, 0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f3b16',
  },
  heroBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#D8F1C5',
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1f3b16',
  },
  content: {
    padding: 24,
  },
  stepsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 20,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepItem: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1f3b16',
    textAlign: 'center',
  },
  stepDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(46, 125, 50, 0.2)',
    marginHorizontal: 8,
  },
  subtitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1B5E20', // Vert foncé naturel
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 16,
    color: '#558B2F', // Vert olive doux
    lineHeight: 24,
    marginBottom: 32,
  },
  textInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.3)', // Vert doux transparent
    borderRadius: 18,
    padding: 18,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)', // Blanc légèrement transparent
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
    borderColor: '#66BB6A', // Vert moyen doux
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    gap: 10,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  photoButtonActive: {
    backgroundColor: '#4CAF50', // Vert émeraude
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
  helperCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(216, 241, 197, 0.9)',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.12)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 12,
  },
  helperTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1f3b16',
    marginBottom: 4,
  },
  helperText: {
    fontSize: 13,
    color: '#2E7D32',
    lineHeight: 20,
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
    backgroundColor: '#4CAF50', // Vert émeraude
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
    backgroundColor: '#BDBDBD', // Gris doux
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


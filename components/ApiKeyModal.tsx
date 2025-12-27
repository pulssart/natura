import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiKey, saveApiKey, exportCreations, importCreations, getCreations } from '../services/storage';

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function ApiKeyModal({ visible, onClose }: ApiKeyModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'api' | 'backup'>('api');
  const fileInputRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      loadApiKey();
    }
  }, [visible]);

  const loadApiKey = async () => {
    const key = await getApiKey();
    if (key) {
      setApiKey(key);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer une clé API valide');
      return;
    }

    try {
      await saveApiKey(apiKey.trim());
      Alert.alert('Succès', 'Clé API sauvegardée avec succès');
      onClose();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de sauvegarder la clé API');
    }
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const creations = await getCreations();
      if (creations.length === 0) {
        Alert.alert('Information', 'Aucune création à exporter');
        setLoading(false);
        return;
      }

      await exportCreations();
      Alert.alert('Succès', `${creations.length} création(s) exportée(s) avec succès`);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'exporter les créations');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (Platform.OS === 'web') {
      // Sur le web, utiliser un input file
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } else {
      // Sur mobile, utiliser expo-document-picker
      Alert.alert('Information', 'L\'import sur mobile nécessite expo-document-picker. Utilisez le partage de fichier.');
    }
  };

  const handleFileSelected = async (event: any) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      
      const creations = await getCreations();
      const hasCreations = creations.length > 0;
      
      if (hasCreations) {
        Alert.alert(
          'Remplacer ou ajouter ?',
          'Vous avez déjà des créations. Que souhaitez-vous faire ?',
          [
            {
              text: 'Annuler',
              style: 'cancel',
              onPress: () => setLoading(false),
            },
            {
              text: 'Remplacer',
              style: 'destructive',
              onPress: async () => {
                try {
                  const count = await importCreations(text, true);
                  Alert.alert('Succès', `${count} création(s) importée(s) (remplacement)`);
                  setLoading(false);
                  onClose();
                } catch (error: any) {
                  Alert.alert('Erreur', error.message || 'Impossible d\'importer les créations');
                  setLoading(false);
                }
              },
            },
            {
              text: 'Ajouter',
              onPress: async () => {
                try {
                  const count = await importCreations(text, false);
                  Alert.alert('Succès', `${count} création(s) ajoutée(s)`);
                  setLoading(false);
                  onClose();
                } catch (error: any) {
                  Alert.alert('Erreur', error.message || 'Impossible d\'importer les créations');
                  setLoading(false);
                }
              },
            },
          ]
        );
      } else {
        const count = await importCreations(text, false);
        Alert.alert('Succès', `${count} création(s) importée(s)`);
        setLoading(false);
        onClose();
      }
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de lire le fichier');
      setLoading(false);
    }
    
    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Réglages</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'api' && styles.tabActive]}
              onPress={() => setActiveTab('api')}
            >
              <Text style={[styles.tabText, activeTab === 'api' && styles.tabTextActive]}>
                API
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'backup' && styles.tabActive]}
              onPress={() => setActiveTab('backup')}
            >
              <Text style={[styles.tabText, activeTab === 'backup' && styles.tabTextActive]}>
                Sauvegarde
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {activeTab === 'api' ? (
              <>
                <Text style={styles.label}>Clé API OpenAI</Text>
                <TextInput
                  style={styles.input}
                  value={apiKey}
                  onChangeText={setApiKey}
                  placeholder="sk-..."
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <Text style={styles.hint}>
                  Votre clé API est stockée localement et utilisée uniquement pour les requêtes à OpenAI.
                </Text>

                <TouchableOpacity
                  style={[styles.saveButton, loading && styles.buttonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  <Text style={styles.saveButtonText}>Sauvegarder</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.sectionTitle}>Export / Import</Text>
                <Text style={styles.hint}>
                  Exportez toutes vos créations dans un fichier JSON incluant les illustrations, ou importez une sauvegarde précédente.
                </Text>

                <TouchableOpacity
                  style={[styles.actionButton, styles.exportButton, loading && styles.buttonDisabled]}
                  onPress={handleExport}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="download-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Exporter les favoris</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.importButton, loading && styles.buttonDisabled]}
                  onPress={handleImport}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Importer une sauvegarde</Text>
                    </>
                  )}
                </TouchableOpacity>

                {Platform.OS === 'web' && (
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                  />
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'rgba(241, 248, 233, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#4CAF50',
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#558B2F',
  },
  tabTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1B5E20',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(76, 175, 80, 0.3)',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'rgba(241, 248, 233, 0.5)',
    marginBottom: 8,
  },
  hint: {
    fontSize: 13,
    color: '#558B2F',
    marginBottom: 20,
    lineHeight: 20,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    gap: 10,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  exportButton: {
    backgroundColor: '#4CAF50',
  },
  importButton: {
    backgroundColor: '#66BB6A',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});


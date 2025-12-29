import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BotanicalCreation } from '../../types';
import { getCreations, deleteCreation } from '../../services/storage';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const numColumns = isTablet ? 3 : 2;
const itemSize = (width - 40 - (numColumns - 1) * 12) / numColumns;

type SectionData = {
  title: string;
  data: BotanicalCreation[];
  type: 'plant' | 'animal' | 'insect';
};

export default function FavoritesScreen() {
  const [creations, setCreations] = useState<BotanicalCreation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const loadCreations = useCallback(async () => {
    const data = await getCreations();
    // Trier par date (plus récent en premier)
    data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setCreations(data);
  }, []);

  // Grouper les créations par type
  const sections = useMemo(() => {
    const plants = creations.filter(c => c.type === 'plant');
    const animals = creations.filter(c => c.type === 'animal');
    const insects = creations.filter(c => c.type === 'insect');

    const sortedSections: SectionData[] = [];

    if (plants.length > 0) {
      sortedSections.push({
        title: 'Végétaux',
        data: plants,
        type: 'plant',
      });
    }

    if (animals.length > 0) {
      sortedSections.push({
        title: 'Animaux',
        data: animals,
        type: 'animal',
      });
    }

    if (insects.length > 0) {
      sortedSections.push({
        title: 'Insectes',
        data: insects,
        type: 'insect',
      });
    }

    return sortedSections;
  }, [creations]);

  const stats = useMemo(
    () => [
      { label: 'Végétaux', value: creations.filter(c => c.type === 'plant').length, icon: 'leaf-outline' as const },
      { label: 'Animaux', value: creations.filter(c => c.type === 'animal').length, icon: 'paw-outline' as const },
      { label: 'Insectes', value: creations.filter(c => c.type === 'insect').length, icon: 'bug-outline' as const },
    ],
    [creations]
  );

  // Recharger les créations quand l'écran est focus (quand on revient sur l'onglet)
  useFocusEffect(
    useCallback(() => {
      loadCreations();
    }, [loadCreations])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCreations();
    setRefreshing(false);
  }, [loadCreations]);

  const handlePress = (creation: BotanicalCreation) => {
    router.push({
      pathname: '/detail',
      params: {
        id: creation.id,
        imageUri: creation.imageUri,
        commonName: creation.commonName,
        scientificName: creation.scientificName,
        description: creation.description,
      },
    });
  };

  const handleLongPress = (creation: BotanicalCreation) => {
    Alert.alert(
      'Supprimer',
      `Voulez-vous supprimer "${creation.commonName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            await deleteCreation(creation.id);
            loadCreations();
          },
        },
      ]
    );
  };

  const handleDelete = (creation: BotanicalCreation) => {
    if (Platform.OS === 'web') {
      // Sur le web, utiliser confirm natif
      if (typeof window !== 'undefined' && window.confirm(`Voulez-vous supprimer "${creation.commonName}" ?`)) {
        console.log('Confirmation OK, suppression de:', creation.id);
        deleteCreation(creation.id)
          .then(() => {
            console.log('Suppression réussie, rechargement...');
            loadCreations();
          })
          .catch((error) => {
            console.error('Erreur lors de la suppression:', error);
            Alert.alert('Erreur', 'Impossible de supprimer la création');
          });
      }
    } else {
      Alert.alert(
        'Supprimer',
        `Voulez-vous supprimer "${creation.commonName}" ?`,
        [
          { text: 'Annuler', style: 'cancel' },
          {
            text: 'Supprimer',
            style: 'destructive',
            onPress: async () => {
              try {
                await deleteCreation(creation.id);
                loadCreations();
              } catch (error) {
                console.error('Erreur lors de la suppression:', error);
                Alert.alert('Erreur', 'Impossible de supprimer la création');
              }
            },
          },
        ]
      );
    }
  };

  const renderSectionHeader = (section: SectionData) => (
    <View style={styles.sectionHeader}>
      <Ionicons 
        name={section.type === 'plant' ? 'leaf' : section.type === 'animal' ? 'paw' : 'bug'} 
        size={20} 
        color="#2E7D32" 
      />
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionCount}>({section.data.length})</Text>
    </View>
  );

  const renderSectionGrid = (section: SectionData) => {
    // Créer des lignes pour la grille
    const rows: BotanicalCreation[][] = [];
    for (let i = 0; i < section.data.length; i += numColumns) {
      rows.push(section.data.slice(i, i + numColumns));
    }

    return (
      <View style={styles.sectionContent}>
        {rows.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((item) => (
              <View key={item.id} style={styles.itemWrapper}>
                {renderItem({ item })}
              </View>
            ))}
            {/* Remplir les colonnes vides pour l'alignement */}
            {row.length < numColumns && Array(numColumns - row.length).fill(null).map((_, idx) => (
              <View key={`empty-${idx}`} style={styles.itemWrapper} />
            ))}
          </View>
        ))}
      </View>
    );
  };

  const renderItem = ({ item }: { item: BotanicalCreation }) => {
    const handleDeletePress = () => {
      console.log('Delete button pressed for:', item.id);
      handleDelete(item);
    };

    return (
      <View style={styles.item}>
        <Pressable
          style={({ pressed }) => [
            styles.itemTouchable,
            pressed && styles.itemTouchablePressed
          ]}
          onPress={() => handlePress(item)}
          onLongPress={() => handleLongPress(item)}
        >
          <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
          <View style={styles.itemOverlay}>
            <Text style={styles.itemName} numberOfLines={2}>
              {item.commonName || 'Nom non disponible'}
            </Text>
            {item.scientificName ? (
              <Text style={styles.itemScientific} numberOfLines={1}>
                {item.scientificName}
              </Text>
            ) : null}
          </View>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.deleteButton,
            pressed && styles.deleteButtonPressed
          ]}
          onPress={(e) => {
            // Empêcher la propagation
            if (Platform.OS === 'web' && e) {
              // @ts-ignore
              e.nativeEvent?.stopPropagation?.();
            }
            console.log('Delete button pressed for:', item.id);
            handleDeletePress();
          }}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          // Sur le web, ajouter onClick natif pour intercepter les événements
          {...(Platform.OS === 'web' && {
            // @ts-ignore - onClick est disponible sur le web
            onClick: (e: any) => {
              e?.stopPropagation?.();
              e?.preventDefault?.();
              console.log('Delete clicked (web onClick) for:', item.id);
              handleDeletePress();
            },
          })}
        >
          <Ionicons name="close-circle" size={24} color="#ff4444" />
        </Pressable>
      </View>
    );
  };

  if (creations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#81C784" />
          <Text style={styles.emptyText}>Aucune création sauvegardée</Text>
          <Text style={styles.emptySubtext}>
            Générez votre première illustration depuis l'écran d'accueil
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.push('/')}> 
            <Ionicons name="sparkles-outline" size={18} color="#fff" />
            <Text style={styles.ctaButtonText}>Créer une illustration</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Créations</Text>
        <Text style={styles.count}>{creations.length} illustration{creations.length > 1 ? 's' : ''}</Text>
        <View style={styles.badge}>
          <Ionicons name="time-outline" size={16} color="#1f3b16" />
          <Text style={styles.badgeText}>Triées par date</Text>
        </View>
      </View>

      <View style={styles.summaryBar}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.summaryItem}>
            <View style={styles.summaryIcon}>
              <Ionicons name={stat.icon} size={16} color="#1f3b16" />
            </View>
            <View>
              <Text style={styles.summaryLabel}>{stat.label}</Text>
              <Text style={styles.summaryValue}>{stat.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {sections.map((section, sectionIndex) => (
          <View key={sectionIndex}>
            {renderSectionHeader(section)}
            {renderSectionGrid(section)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F8E9', // Jaune-vert pâle lumineux
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(76, 175, 80, 0.2)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  count: {
    fontSize: 15,
    color: '#558B2F',
    fontWeight: '500',
  },
  badge: {
    marginTop: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#E5F3D8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.15)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1f3b16',
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.08)',
  },
  summaryIcon: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: '#E5F3D8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#3C5B2F',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1B5E20',
  },
  list: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 8,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 16,
    color: '#558B2F',
    fontWeight: '500',
  },
  sectionContent: {
    marginBottom: 24,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  itemWrapper: {
    width: itemSize,
  },
  item: {
    width: '100%',
    height: itemSize * 1.2,
    borderRadius: 18,
    overflow: 'visible',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  itemTouchable: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
  },
  itemTouchablePressed: {
    opacity: 0.85,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 4,
    zIndex: 1000,
    elevation: 10,
    cursor: Platform.OS === 'web' ? 'pointer' : 'default',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  deleteButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  itemImage: {
    width: '100%',
    height: '75%',
    resizeMode: 'cover',
  },
  itemOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B5E20',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  itemScientific: {
    fontSize: 12,
    color: '#558B2F',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#558B2F',
    marginTop: 20,
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  emptySubtext: {
    fontSize: 15,
    color: '#81C784',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 40,
  },
  ctaButton: {
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4CAF50',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    shadowColor: '#2E7D32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});


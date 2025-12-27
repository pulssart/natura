import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BotanicalCreation } from '../../types';
import { getCreations, deleteCreation } from '../../services/storage';

const { width } = Dimensions.get('window');
const isTablet = width >= 768;
const numColumns = isTablet ? 3 : 2;
const itemSize = (width - 40 - (numColumns - 1) * 12) / numColumns;

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

  useEffect(() => {
    loadCreations();
  }, [loadCreations]);

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

  const renderItem = ({ item }: { item: BotanicalCreation }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => handlePress(item)}
      onLongPress={() => handleLongPress(item)}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.imageUri }} style={styles.itemImage} />
      <View style={styles.itemOverlay}>
        <Text style={styles.itemName} numberOfLines={2}>
          {item.commonName}
        </Text>
        <Text style={styles.itemScientific} numberOfLines={1}>
          {item.scientificName}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (creations.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.emptyContainer}>
          <Ionicons name="bookmark-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Aucune création sauvegardée</Text>
          <Text style={styles.emptySubtext}>
            Générez votre première illustration depuis l'écran d'accueil
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Mes Créations</Text>
        <Text style={styles.count}>{creations.length} illustration{creations.length > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={creations}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.list}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d5016',
    marginBottom: 4,
  },
  count: {
    fontSize: 14,
    color: '#666',
  },
  list: {
    padding: 12,
  },
  row: {
    justifyContent: 'space-between',
  },
  item: {
    width: itemSize,
    height: itemSize * 1.2,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemImage: {
    width: '100%',
    height: '75%',
    resizeMode: 'cover',
  },
  itemOverlay: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  itemScientific: {
    fontSize: 11,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});


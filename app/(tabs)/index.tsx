import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import SkillCard from '../../components/SkillCard';
import { supabase } from '../../lib/supabase';
import { COLORS } from '../../lib/theme';

type SkillCardData = {
  id: string;
  title: string;
  emoji: string;
  doctor_id?: string;
  doctor_name?: string;
  avg_rating?: number | null;
  reviews_count?: number | null;
  orders_count?: number | null;
};

type CategoryData = {
  id: string;
  key: string;
  name: string;
  emoji: string;
  skillCards: SkillCardData[];
};

export default function HomeScreen() {
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // Fetch categories with their skill cards
        const { data: categoriesData, error: catError } = await supabase
          .from('skill_categories')
          .select('id, key, name, emoji')
          .order('name', { ascending: true });

        if (catError) throw catError;
        if (!mounted) return;

        const categoriesWithCards: CategoryData[] = [];

        for (const category of categoriesData || []) {
          // Fetch skill cards for this category
          const { data: skillCards, error: skillError } = await supabase
            .from('skill_cards')
            .select('id, title, emoji, doctor_id, avg_rating, reviews_count, orders_count')
            .eq('category_id', category.id)
            .order('created_at', { ascending: true })
            .limit(10); // Limit to 10 cards per category

          if (skillError) {
            console.warn(`Failed to fetch skill cards for ${category.name}:`, skillError);
            continue;
          }

          if (skillCards && skillCards.length > 0) {
            // Enrich with doctor names
            const docIds = Array.from(new Set(skillCards.map(c => c.doctor_id).filter(Boolean))) as string[];
            const nameMap = new Map<string, string>();

            if (docIds.length > 0) {
              const { data: docs } = await supabase
                .from('doctors')
                .select('id, profiles(full_name)')
                .in('id', docIds);

              if (docs) {
                for (const d of docs as any[]) {
                  const name = (Array.isArray(d.profiles) ? d.profiles[0]?.full_name : d.profiles?.full_name) as string | undefined;
                  if (d.id && name) nameMap.set(d.id as string, name);
                }
              }
            }

            const enrichedCards = skillCards.map(card => ({
              ...card,
              doctor_name: (card.doctor_id && nameMap.get(card.doctor_id)) || undefined
            }));

            categoriesWithCards.push({
              ...category,
              skillCards: enrichedCards
            });
          }
        }

        if (mounted) {
          setCategories(categoriesWithCards);
        }
      } catch (error) {
        console.error('Failed to load skill cards:', error);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const renderSkillCard = ({ item }: { item: SkillCardData }) => (
    <TouchableOpacity
      style={styles.skillCardContainer}
      onPress={() => router.push({ pathname: '/(tabs)/(skill)/[id]', params: { id: String(item.id) } })}
    >
      <SkillCard
        title={item.title}
        emoji={item.emoji || '💡'}
        subtitle={item.doctor_name}
        rating={typeof item.avg_rating === 'number' ? item.avg_rating : undefined}
        reviewsCount={typeof item.reviews_count === 'number' ? item.reviews_count : undefined}
        ordersCount={typeof item.orders_count === 'number' ? item.orders_count : undefined}
      />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading healthcare services...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Healthcare Services</Text>
      
      {categories.map((category) => (
        <View key={category.id} style={styles.categorySection}>
          <Text style={styles.categoryTitle}>
            {category.emoji} {category.name}
          </Text>
          <FlatList
            data={category.skillCards}
            renderItem={renderSkillCard}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.skillCardsList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No services available</Text>
            }
          />
        </View>
      ))}

      {categories.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No healthcare services available yet.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    marginTop: 16,
    marginHorizontal: 16,
    color: '#2c3e50',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  categorySection: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 12,
    color: '#2c3e50',
  },
  skillCardsList: {
    paddingHorizontal: 12,
  },
  skillCardContainer: {
    marginHorizontal: 4,
    width: 280,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#95a5a6',
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

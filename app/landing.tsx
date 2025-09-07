import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import SkillCard from '../components/SkillCard';
import { supabase } from '../lib/supabase';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { PHYSICIAN_CATEGORIES, type SkillCategoryKey } from '@/lib/types';

type UICategory = { id?: string; key: SkillCategoryKey | string; name: string; emoji?: string };
const FALLBACK_CATS: UICategory[] = PHYSICIAN_CATEGORIES.map((c) => ({ key: c.key, name: c.name, emoji: c.emoji }));
type UISubcategory = { id?: string; key: string; name: string };
const FALLBACK_SUBS: Record<string, UISubcategory[]> = Object.fromEntries(
  PHYSICIAN_CATEGORIES.map((c) => [c.key, c.subs.map((s) => ({ key: s.key, name: s.name }))])
);

export default function Landing() {
  type Selected = 'all' | string; // store key; we'll map to id if available
  const [selectedCat, setSelectedCat] = useState<Selected>('all');
  const [categories, setCategories] = useState<UICategory[]>(FALLBACK_CATS);
  const [selectedSub, setSelectedSub] = useState<'all' | string>('all');
  const [subcategories, setSubcategories] = useState<UISubcategory[]>([]);
  const [cards, setCards] = useState<{
    id: string | number;
    title: string;
    emoji: string;
    doctor_id?: string;
    doctor_name?: string;
    doctor_avatar?: string;
    avg_rating?: number | null;
    reviews_count?: number | null;
    orders_count?: number | null;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Auth session watcher - redirect authenticated users or show account icon when signed out
  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      
      if (data.session) {
        // User is authenticated, check role and redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', data.session.user.id)
          .single();
        
        if (!mounted) return;
        
        if (profile?.role === 'doctor') {
          router.replace('/(doctor)');
        } else {
          router.replace('/(tabs)');
        }
        return;
      }
      
      // User is not authenticated, show landing page
      setHasSession(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      if (session) {
        // User signed in, check role and redirect
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.role === 'doctor') {
          router.replace('/(doctor)');
        } else {
          router.replace('/(tabs)');
        }
      } else {
        // User signed out, show landing page
        setHasSession(false);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [router]);

  // Load categories from DB with fallback
  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('skill_categories')
          .select('id,key,name,emoji')
          .order('name', { ascending: true });
        if (error) throw error;
        if (data && data.length) {
          setCategories(data as any);
        }
      } catch (_) {
        setCategories(FALLBACK_CATS);
      }
    })();
  }, []);

  // Load subcategories when category changes
  useEffect(() => {
    if (selectedCat === 'all') {
      setSubcategories([]);
      setSelectedSub('all');
      return;
    }
    const sel = categories.find((c) => c.key === selectedCat);
    (async () => {
      if (sel?.id) {
        try {
          const { data, error } = await supabase
            .from('skill_subcategories')
            .select('id,key,name')
            .eq('category_id', sel.id)
            .order('name', { ascending: true });
          if (error) throw error;
          if (data) {
            setSubcategories(data as any);
            setSelectedSub('all');
            return;
          }
        } catch (_) {
          // fall back below
        }
      }
      setSubcategories(FALLBACK_SUBS[selectedCat] || []);
      setSelectedSub('all');
    })();
  }, [selectedCat, categories]);

  // Load cards when filters change
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const base = supabase.from('skill_cards').select('id,title,emoji,doctor_id,avg_rating,reviews_count,orders_count');

        let data: any, error: any;
        if (selectedCat === 'all') {
          ({ data, error } = await base.order('created_at', { ascending: true }));
        } else if (selectedSub !== 'all') {
          const sub = subcategories.find((s) => s.key === selectedSub);
          if (sub?.id) {
            ({ data, error } = await base.eq('subcategory_id', sub.id).order('created_at', { ascending: true }));
            if (error && String(error.message || '').toLowerCase().includes('subcategory_id')) {
              const sel = categories.find((c) => c.key === selectedCat);
              if (sel?.id) {
                ({ data, error } = await base.eq('category_id', sel.id).order('created_at', { ascending: true }));
              }
            }
          } else {
            const sel = categories.find((c) => c.key === selectedCat);
            if (sel?.id) {
              ({ data, error } = await base.eq('category_id', sel.id).order('created_at', { ascending: true }));
            } else {
              data = [];
            }
          }
        } else {
          const sel = categories.find((c) => c.key === selectedCat);
          if (sel?.id) {
            ({ data, error } = await base.eq('category_id', sel.id).order('created_at', { ascending: true }));
          } else {
            data = [];
          }
        }

        if (error) throw error;

        // Enrich with doctor name via doctors -> profiles to avoid RLS issues on profiles
        const list = (data || []) as Array<{
          id: string | number;
          title: string;
          emoji: string;
          doctor_id?: string;
          avg_rating?: number | null;
          reviews_count?: number | null;
          orders_count?: number | null;
        }>;
        const docIds = Array.from(new Set(list.map((c) => c.doctor_id).filter(Boolean))) as string[];

        if (docIds.length) {
          const { data: docs, error: docErr } = await supabase
            .from('doctors')
            .select('id, profiles(full_name, avatar_url)')
            .in('id', docIds);

          const nameMap = new Map<string, string>();
          const avatarMap = new Map<string, string | undefined>();
          if (!docErr && Array.isArray(docs)) {
            for (const d of docs as any[]) {
              const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
              const name = profile?.full_name as string | undefined;
              const avatar = profile?.avatar_url as string | undefined;
              if (d.id) {
                if (name) nameMap.set(d.id as string, name);
                if (avatar) avatarMap.set(d.id as string, avatar);
              }
            }
          }

          const enriched = list.map((c) => ({
            ...c,
            doctor_name: (c.doctor_id && nameMap.get(c.doctor_id)) || undefined,
            doctor_avatar: (c.doctor_id && avatarMap.get(c.doctor_id)) || undefined,
          }));
          setCards(enriched as any);
        } else {
          setCards(list as any);
        }
      } catch (error) {
        console.error('Failed to load skills:', error);
        setCards([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedCat, selectedSub, categories, subcategories]);

  return (
    <View style={styles.container}>
      {hasSession === false && (
        <TouchableOpacity
          onPress={() => router.push('/auth/sign-in')}
          style={styles.accountBtn}
          accessibilityRole="button"
          accessibilityLabel="Sign in"
        >
          <Ionicons name="person-circle-outline" size={28} color="#25292e" />
        </TouchableOpacity>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>Remocare</Text>
        <Text style={styles.subtitle}>Quality care at your fingertips.</Text>
        {/* Category switch (fixed height to prevent layout shift) */}
        <View style={styles.barContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
            <TouchableOpacity
              onPress={() => setSelectedCat('all')}
              style={[styles.pill, selectedCat === 'all' && styles.pillActive]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.pillText, selectedCat === 'all' && styles.pillTextActive]}>All</Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                onPress={() => setSelectedCat(cat.key)}
                style={[styles.pill, selectedCat === cat.key && styles.pillActive]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.pillText, selectedCat === cat.key && styles.pillTextActive]}>{cat.emoji} {cat.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Subcategory switch (reserve height even when hidden) */}
        <View style={styles.subBarContainer}>
          {selectedCat !== 'all' ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
              <TouchableOpacity
                onPress={() => setSelectedSub('all')}
                style={[styles.pill, selectedSub === 'all' && styles.pillActive]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.pillText, selectedSub === 'all' && styles.pillTextActive]}>All</Text>
              </TouchableOpacity>
              {subcategories.map((sub) => (
                <TouchableOpacity
                  key={sub.key}
                  onPress={() => setSelectedSub(sub.key)}
                  style={[styles.pill, selectedSub === sub.key && styles.pillActive]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.pillText, selectedSub === sub.key && styles.pillTextActive]}>{sub.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.subBarPlaceholder} />
          )}
        </View>

        {/* Grid with overlay spinner to avoid layout jumps */}
        <View style={styles.gridWrapper}>
          <FlatList
            data={cards}
            keyExtractor={(item) => String(item.id)}
            numColumns={2}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.gridItem}
                onPress={() =>
                  router.push({ pathname: '/skill/[id]', params: { id: String(item.id), doctorName: item.doctor_name || '', doctorAvatar: item.doctor_avatar || '' } })
                }
              >
                <SkillCard
                  title={item.title}
                  emoji={item.emoji || '💡'}
                  subtitle={item.doctor_name}
                  avatarUrl={item.doctor_avatar}
                  rating={typeof item.avg_rating === 'number' ? item.avg_rating : undefined}
                  reviewsCount={typeof item.reviews_count === 'number' ? item.reviews_count : undefined}
                  ordersCount={typeof item.orders_count === 'number' ? item.orders_count : undefined}
                />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.cardRow}
            ListEmptyComponent={() => (
              <Text style={{ color: '#666', marginTop: 8 }}>No skills yet.</Text>
            )}
          />
          {loading && (
            <View style={styles.spinnerOverlay}>
              <ActivityIndicator />
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  content: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  accountBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  barContainer: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
  },
  subBarContainer: {
    width: '100%',
    height: 56,
    justifyContent: 'center',
  },
  subBarPlaceholder: {
    width: '100%',
    height: 40,
  },
  hero: {
    width: '100%',
    maxWidth: 600,
    aspectRatio: 16 / 9,
    marginBottom: 32,
    borderRadius: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  cardRow: {
    marginTop: 16,
    marginBottom: 0,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridRow: {
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  gridWrapper: {
    position: 'relative',
    width: '100%',
    minHeight: 260,
  },
  spinnerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  pillsRow: {
    paddingHorizontal: 8,
    gap: 8,
    alignItems: 'center',
  },
  pill: {
    height: 40,
    width: 140,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 0,
    paddingHorizontal: 12,
  },
  pillActive: {
    backgroundColor: '#25292e',
    borderColor: '#25292e',
  },
  pillText: {
    color: '#333',
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#ffd33d',
  },
});

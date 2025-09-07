import { COLORS } from '@/lib/theme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { PHYSICIAN_CATEGORIES } from '@/lib/types';

type UICategory = { id?: string; key: string; name: string; emoji?: string };
const FALLBACK_CATS: UICategory[] = PHYSICIAN_CATEGORIES.map((c) => ({ key: c.key, name: c.name, emoji: c.emoji }));
type UISubcategory = { id?: string; key: string; name: string };
const FALLBACK_SUBS: Record<string, UISubcategory[]> = Object.fromEntries(
  PHYSICIAN_CATEGORIES.map((c) => [c.key, c.subs.map((s) => ({ key: s.key, name: s.name }))])
);

export default function EditSkillModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [images, setImages] = useState(''); // comma-separated URLs
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<UICategory[]>(FALLBACK_CATS);
  const [selectedKey, setSelectedKey] = useState<string>(FALLBACK_CATS[0]?.key ?? 'primary_care');
  const [subcategories, setSubcategories] = useState<UISubcategory[]>([]);
  const [selectedSubKey, setSelectedSubKey] = useState<string>(''); // '' means None
  const [initialSubId, setInitialSubId] = useState<string | null>(null);
  const [initialCatId, setInitialCatId] = useState<string | null>(null);
  const [subOpen, setSubOpen] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('skill_categories')
          .select('id,key,name,emoji')
          .order('name', { ascending: true });
        if (error) throw error;
        if (data && data.length) {
          const ui = data.map((d: any) => ({ id: d.id as string, key: d.key as string, name: d.name as string, emoji: d.emoji as string | undefined })) as UICategory[];
          setCategories(ui);
          // keep selectedKey as-is; will be set by fetchSkill using legacy text
        }
      } catch (_) {
        // fallback already set
      }
    })();
    if (id) fetchSkill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Load subcategories whenever category changes
  useEffect(() => {
    const sel = categories.find((c) => c.key === selectedKey);
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
            if (initialSubId) {
              const match = (data as any[]).find((s) => s.id === initialSubId);
              if (match) { setSelectedSubKey(match.key as string); setSubOpen(false); }
              setInitialSubId(null);
            } else {
              setSelectedSubKey('');
              setSubOpen(true);
            }
            return;
          }
        } catch (_) {
          // ignore and fallback below
        }
      }
      // fallback: constants
      setSubcategories(FALLBACK_SUBS[selectedKey] || []);
      setSelectedSubKey('');
      setSubOpen(true);
    })();
  }, [selectedKey, categories]);

  // Apply initial category selection when categories with IDs have loaded
  useEffect(() => {
    if (initialCatId) {
      const match = categories.find((c) => c.id === initialCatId);
      if (match) {
        setSelectedKey(match.key);
        setInitialCatId(null);
      }
    }
  }, [categories, initialCatId]);

  const fetchSkill = async () => {
    try {
      let { data, error } = await supabase
        .from('skill_cards')
        .select('title, emoji, years_experience, images, description, category_id, subcategory_id')
        .eq('id', id)
        .single();
      if (error) {
        const msg = String(error.message || '').toLowerCase();
        if (msg.includes('subcategory_id')) {
          const r1 = await supabase
            .from('skill_cards')
            .select('title, emoji, years_experience, images, description, category_id')
            .eq('id', id)
            .single();
          data = r1.data as any;
          error = r1.error as any;
        }
        if (error) throw error;
      }
      if (data) {
        setTitle(data.title || '');
        setEmoji(data.emoji || '');
        setYearsExp(data.years_experience !== null ? String(data.years_experience) : '');
        setImages(data.images && data.images.length ? (data.images as string[]).join(', ') : '');
        setDescription(data.description || '');
        // store category_id for later application and try immediate match
        if ('category_id' in data) {
          setInitialCatId((data as any).category_id ?? null);
          const match = categories.find((c) => c.id === (data as any).category_id);
          if (match) setSelectedKey(match.key);
        }
        if ('subcategory_id' in data) {
          setInitialSubId((data as any).subcategory_id ?? null);
        }
      }
    } catch (err: any) {
      Alert.alert('Error', err.message);
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    // Basic validation
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a skill title.');
      return;
    }
    const yearsNum = parseInt(yearsExp, 10);
    if (yearsExp && (isNaN(yearsNum) || yearsNum < 0 || yearsNum > 80)) {
      Alert.alert('Validation', 'Enter valid years of experience (0-80).');
      return;
    }

    setSaving(true);
    try {
      const imagesArr = images
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.length);

      const selCat = categories.find((c) => c.key === selectedKey);
      const selSub = subcategories.find((s) => s.key === selectedSubKey);

      let { error } = await supabase
        .from('skill_cards')
        .update({
          title: title.trim(),
          emoji: emoji.trim() || '💡',
          years_experience: yearsExp ? yearsNum : null,
          images: imagesArr.length ? imagesArr : null,
          description: description.trim() || null,
          // normalized
          category_id: selCat?.id ?? null,
          subcategory_id: selSub?.id ?? null,
        })
        .eq('id', id);

      if (error) {
        let msg = String(error.message || '').toLowerCase();
        // Fallback if subcategory_id column doesn't exist yet
        if (msg.includes('subcategory_id')) {
          const retry1 = await supabase
            .from('skill_cards')
            .update({
              title: title.trim(),
              emoji: emoji.trim() || '💡',
              years_experience: yearsExp ? yearsNum : null,
              images: imagesArr.length ? imagesArr : null,
              description: description.trim() || null,
              category_id: selCat?.id ?? null,
            })
            .eq('id', id);
          error = retry1.error as any;
          if (!error) {
            router.back();
            return;
          }
          msg = String(error.message || '').toLowerCase();
        }
        if (error) {
          throw error;
        }
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.flex, styles.center]}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.header}>Edit Skill</Text>
        {/* Category switch */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setSelectedKey(cat.key)}
              style={[styles.pill, selectedKey === cat.key && styles.pillActive]}
            >
              <Text numberOfLines={1} ellipsizeMode="tail" style={[styles.pillText, selectedKey === cat.key && styles.pillTextActive]}>{cat.emoji} {cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Subcategory dropdown */}
        <View style={{ marginBottom: 12 }}>
          <TouchableOpacity
            style={styles.dropdownTrigger}
            onPress={() => setSubOpen((v) => !v)}
          >
            <Text style={styles.dropdownText}>
              {selectedSubKey
                ? subcategories.find((s) => s.key === selectedSubKey)?.name || 'Select subcategory'
                : 'Select subcategory (optional)'}
            </Text>
          </TouchableOpacity>
          {subOpen && (
            <View style={styles.dropdownMenu}>
              <ScrollView style={{ maxHeight: 180 }}>
                <TouchableOpacity
                  onPress={() => { setSelectedSubKey(''); setSubOpen(false); }}
                  style={styles.dropdownItem}
                >
                  <Text style={styles.dropdownItemText}>None</Text>
                </TouchableOpacity>
                {subcategories.map((sub) => (
                  <TouchableOpacity
                    key={sub.key}
                    onPress={() => { setSelectedSubKey(sub.key); setSubOpen(false); }}
                    style={styles.dropdownItem}
                  >
                    <Text style={styles.dropdownItemText}>{sub.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
        <TextInput
          placeholder="Skill Title"
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Emoji (optional)"
          style={styles.input}
          value={emoji}
          onChangeText={setEmoji}
        />

        <TextInput
          placeholder="Years of Experience"
          style={styles.input}
          value={yearsExp}
          onChangeText={setYearsExp}
          keyboardType="numeric"
        />
        <TextInput
          placeholder="Image URLs (comma separated)"
          style={styles.input}
          value={images}
          onChangeText={setImages}
        />
        <TextInput
          placeholder="Description (optional)"
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          multiline
        />
        <TouchableOpacity
          style={[styles.saveBtn, (loading || saving) && styles.disabledBtn]}
          onPress={handleSave}
          disabled={loading || saving}
        >
          <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={loading || saving}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  pillsRow: {
    paddingHorizontal: 8,
    marginBottom: 12,
    flexDirection: 'row',
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
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#fafafa',
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
  },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: '#aaa',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
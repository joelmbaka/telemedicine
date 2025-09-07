import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '@/lib/theme';
import { PHYSICIAN_CATEGORIES } from '@/lib/types';

type UICategory = { id?: string; key: string; name: string; emoji?: string };
const FALLBACK_CATS: UICategory[] = PHYSICIAN_CATEGORIES.map((c) => ({ key: c.key, name: c.name, emoji: c.emoji }));
type UISubcategory = { id?: string; key: string; name: string };
const FALLBACK_SUBS: Record<string, UISubcategory[]> = Object.fromEntries(
  PHYSICIAN_CATEGORIES.map((c) => [c.key, c.subs.map((s) => ({ key: s.key, name: s.name }))])
);

export default function NewSkillModal() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [images, setImages] = useState(''); // comma-separated URLs
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<UICategory[]>(FALLBACK_CATS);
  const [selectedKey, setSelectedKey] = useState<string>(FALLBACK_CATS[0]?.key ?? 'primary_care');
  const [subcategories, setSubcategories] = useState<UISubcategory[]>(FALLBACK_SUBS[selectedKey] || []);
  const [selectedSubKey, setSelectedSubKey] = useState<string>(''); // '' means None
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
          if (!ui.find((c) => c.key === selectedKey)) {
            setSelectedKey(ui[0].key);
          }
        }
      } catch (_) {
        // fallback already set
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load subcategories when category changes
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
            setSelectedSubKey(''); // reset to None
            setSubOpen(true); // open dropdown after picking category
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
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;
      if (!userId) throw new Error('No user');

      const safeEmoji = emoji.trim() || '💡'; // skill_cards.emoji is NOT NULL in DB

      const imagesArr = images
        .split(',')
        .map((u) => u.trim())
        .filter((u) => u.length);

      const selCat = categories.find((c) => c.key === selectedKey);
      const selSub = subcategories.find((s) => s.key === selectedSubKey);

      let { error } = await supabase
        .from('skill_cards')
        .insert({
          title: title.trim(),
          emoji: safeEmoji,
          doctor_id: userId,
          images: imagesArr.length ? imagesArr : null,
          years_experience: yearsNum || null,
          description: description.trim() || null,
          // Normalized fields
          category_id: selCat?.id ?? null,
          subcategory_id: selSub?.id ?? null,
        });

      if (error) {
        const msg = String(error.message || '').toLowerCase();
        // Fallback if subcategory_id column doesn't exist yet
        if (msg.includes('subcategory_id')) {
          const retry1 = await supabase
            .from('skill_cards')
            .insert({
              title: title.trim(),
              emoji: safeEmoji,
              doctor_id: userId,
              images: imagesArr.length ? imagesArr : null,
              years_experience: yearsNum || null,
              description: description.trim() || null,
              category_id: selCat?.id ?? null,
            });
          error = retry1.error as any;
        }
        if (error) throw error;
      }
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Add New Skill</Text>
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
          style={[styles.saveBtn, loading && styles.disabledBtn]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveText}>{loading ? 'Saving…' : 'Save'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fafafa',
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

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '@/lib/theme';

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

  useEffect(() => {
    if (id) fetchSkill();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSkill = async () => {
    try {
      const { data, error } = await supabase
        .from('skill_cards')
        .select('title, emoji, years_experience, images, description')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) {
        setTitle(data.title || '');
        setEmoji(data.emoji || '');
        setYearsExp(data.years_experience !== null ? String(data.years_experience) : '');
        setImages(data.images && data.images.length ? (data.images as string[]).join(', ') : '');
        setDescription(data.description || '');
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

      const { error } = await supabase
        .from('skill_cards')
        .update({
          title: title.trim(),
          emoji: emoji.trim() || '💡',
          years_experience: yearsExp ? yearsNum : null,
          images: imagesArr.length ? imagesArr : null,
          description: description.trim() || null,

        })
        .eq('id', id);

      if (error) throw error;
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
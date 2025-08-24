import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { COLORS } from '@/lib/theme';

export default function NewSkillModal() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [emoji, setEmoji] = useState('');
  const [yearsExp, setYearsExp] = useState('');
  const [images, setImages] = useState(''); // comma-separated URLs
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

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
    if (!title.trim()) {
      Alert.alert('Validation', 'Please enter a skill title.');
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

      const { error } = await supabase
        .from('skill_cards')
        .insert({
          title: title.trim(),
          emoji: safeEmoji,
          doctor_id: userId,
          images: imagesArr.length ? imagesArr : null,
          years_experience: yearsNum || null,
          description: description.trim() || null,
        });

      if (error) throw error;
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

import { Link } from 'expo-router';
import { StyleSheet, Text, View, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import SkillCard from '../components/SkillCard';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const [cards, setCards] = useState<{id:string,title:string,emoji:string}[]>([]);
  const [loading, setLoading] = useState(true);
  const defaultCards = [
    { id: '1', title: 'Flu-Fighter', emoji: '🦸‍♂️' },
    { id: '2', title: 'Sleep-Sensei', emoji: '😴' },
    { id: '3', title: 'Mind-Mender', emoji: '🧘‍♀️' },
  ];

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('skill_cards').select('id,title,emoji').limit(10);
      if (!error && data) setCards(data as any);
      setLoading(false);
    })();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to Remote Care</Text>
        <Text style={styles.subtitle}>Quality care at your fingertips.</Text>
        {loading ? (
          <ActivityIndicator />
        ) : (
          <FlatList
            data={cards.length ? cards : defaultCards}
            horizontal
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            renderItem={({ item }) => (
              <SkillCard title={item.title} emoji={item.emoji} />
            )}
            contentContainerStyle={styles.cardRow}
          />
        )}
        <Link href="/auth/sign-in" asChild>
          <TouchableOpacity style={styles.button}>
            <Text style={styles.buttonText}>Sign In / Sign Up</Text>
          </TouchableOpacity>
        </Link>
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
    justifyContent: 'center',
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
  button: {
    backgroundColor: '#25292e',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffd33d',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

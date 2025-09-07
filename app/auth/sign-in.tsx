import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Link } from 'expo-router';
import { useRouter } from 'expo-router';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleSignIn() {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      Alert.alert(error.message);
    } else if (data?.user) {
      // Get user role after successful sign-in
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      
      // Navigate based on role (default to patient if role fetch fails)
      if (profile?.role === 'doctor') {
        router.replace('/(doctor)');
      } else {
        // Default to patient tabs if no role or role fetch failed
        router.replace('/(tabs)');
      }
      
      if (profileError) {
        console.warn('Failed to fetch user role, defaulting to patient:', profileError);
      }
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign in to your Remocare account</Text>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Email"
          leftIcon={{ type: 'font-awesome', name: 'envelope' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input
          label="Password"
          leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title="Sign In" 
          disabled={loading} 
          onPress={handleSignIn} 
          loading={loading}
          buttonStyle={{ backgroundColor: '#25292e' }}
          titleStyle={{ color: '#ffd33d' }}
        />
      </View>
      <View style={styles.linkContainer}>
        <Link href="/auth/sign-up" style={styles.link}>
          Don't have an account? <Text style={{ color: '#ffd33d', fontWeight: 'bold' }}>Sign up</Text>
        </Link>
        <Link href="/auth/sign-up?role=doctor" style={styles.link}>
          Are you a doctor? <Text style={{ color: '#ffd33d', fontWeight: 'bold' }}>Sign up as a doctor</Text>
        </Link>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
  linkContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  link: {
    color: '#25292e',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#25292e',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(46, 125, 50, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1.2,
  },
});

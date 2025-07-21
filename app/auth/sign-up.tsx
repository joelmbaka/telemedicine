import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Link } from 'expo-router';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match");
      return;
    }
    
    setLoading(true);
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: fullName }
      }
    });
    
    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert('Check your email for verification!');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>my health hub</Text>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input
          label="Full Name"
          leftIcon={{ type: 'font-awesome', name: 'user' }}
          onChangeText={setFullName}
          value={fullName}
          placeholder="John Doe"
          autoCapitalize="words"
        />
      </View>
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
      <View style={styles.verticallySpaced}>
        <Input
          label="Confirm Password"
          leftIcon={{ type: 'font-awesome', name: 'lock' }}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          placeholder="Confirm Password"
          autoCapitalize="none"
        />
      </View>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button 
          title="Create Account" 
          disabled={loading} 
          onPress={handleSignUp} 
          buttonStyle={{ backgroundColor: '#2E7D32' }}
          loading={loading}
        />
      </View>
      <View style={styles.linkContainer}>
        <Link href="/auth/sign-in" style={styles.link}>
          Already have an account? <Text style={{ color: '#2E7D32', fontWeight: 'bold' }}>Sign in</Text>
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
    color: '#2E7D32',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
    textShadowColor: 'rgba(46, 125, 50, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    letterSpacing: 1.2,
  },
});

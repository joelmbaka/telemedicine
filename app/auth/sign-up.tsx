import React, { useState } from 'react';
import { Alert, StyleSheet, View, Text } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Button, Input } from '@rneui/themed';
import { Link, useRouter, useLocalSearchParams } from 'expo-router';

export default function SignUp() {
  const params = useLocalSearchParams();
  const roleParam = Array.isArray(params.role) ? params.role[0] : (params.role ?? '');
  const isDoctor = roleParam === 'doctor';
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  async function handleSignUp() {
    if (password !== confirmPassword) {
      Alert.alert("Passwords don't match");
      return;
    }
    
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { full_name: fullName, role: isDoctor ? 'doctor' : 'patient' }
      }
    });
    if (error) {
      Alert.alert(error.message);
      setLoading(false);
      return;
    }

    // If signUp returned a user, attempt to create / update profile row (in case DB trigger is missing)
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        full_name: fullName,
        role: isDoctor ? 'doctor' : 'patient',
      });
    }

    // Redirect if session already established (email confirm off)
    if (data.session) {
      if (isDoctor) {
        router.push('/(modals)/doctor-onboarding');
      } else {
        router.replace('/(tabs)');
      }
    } else {
      Alert.alert('Account created! Please check your email to confirm your address before signing in.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign up for your Remocare account</Text>
      {isDoctor && (
        <Text style={styles.roleSubtitle}>Creating a doctor account – you’ll complete your profile and first Skill Card next.</Text>
      )}
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
          buttonStyle={{ backgroundColor: '#25292e' }}
          titleStyle={{ color: '#ffd33d' }}
          loading={loading}
        />
      </View>
      <View style={styles.linkContainer}>
        {!isDoctor && (
          <Link href="/auth/sign-up?role=doctor" style={styles.link}>
            Are you a doctor? <Text style={{ color: '#ffd33d', fontWeight: 'bold' }}>Sign up as a doctor</Text>
          </Link>
        )}
      </View>
      <View style={styles.linkContainer}>
        <Link href="/auth/sign-in" style={styles.link}>
          Already have an account? <Text style={{ color: '#ffd33d', fontWeight: 'bold' }}>Sign in</Text>
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
  roleSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,

  },
});

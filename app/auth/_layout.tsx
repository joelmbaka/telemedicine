import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthLayout() {
  const router = useRouter();
  
  // If a session already exists, immediately redirect out of /auth
  useEffect(() => {
    let mounted = true;
    const goHome = async () => {
      const { data } = await supabase.auth.getSession();
      const session = data?.session;
      if (!mounted || !session) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (profile?.role === 'doctor') router.replace('/(doctor)');
      else router.replace('/(tabs)');
    };
    goHome();
    return () => {
      mounted = false;
    };
  }, [router]);
  return (
    <Stack screenOptions={{
      headerTitleAlign: 'center',
    }}>
      <Stack.Screen 
        name="sign-in" 
        options={{
          title: 'Sign In',
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/')} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </Pressable>
          ),
        }} 
      />
      <Stack.Screen 
        name="sign-up" 
        options={{
          title: 'Create Account',
          headerLeft: () => (
            <Pressable onPress={() => router.replace('/')} style={{ marginLeft: 15 }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </Pressable>
          ),
        }} 
      />
    </Stack>
  );
}

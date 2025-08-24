import { Stack, useRouter } from 'expo-router';
import { Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function AuthLayout() {
  const router = useRouter();
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

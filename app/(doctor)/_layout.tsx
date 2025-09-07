import { Tabs, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { COLORS } from '@/lib/theme';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DoctorTabLayout() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        router.replace('/auth/sign-in');
        return;
      }
      
      // Check if user has doctor role
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.session.user.id)
        .single();
      
      if (!mounted) return;
      
      // If user is not a doctor (patient or no role), redirect to patient area
      if (profile?.role !== 'doctor') {
        router.replace('/(tabs)');
        return;
      }
      
      if (profileError) {
        console.warn('Failed to fetch user role in doctor area, redirecting to patient tabs:', profileError);
        router.replace('/(tabs)');
        return;
      }
      
      setChecked(true);
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (!checked) return null;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        headerShown: false,
        headerStyle: { backgroundColor: '#25292e' },
        headerShadowVisible: false,
        headerTintColor: '#fff',
        tabBarStyle: { backgroundColor: '#25292e' },
      }}
    >
      {/* Hide root index route from tab bar */}
      <Tabs.Screen name="index" options={{ href: null }} />
      {/* Hide dynamic routes from tab bar */}
      <Tabs.Screen name="appointment/[id]" options={{ href: null }} />
      <Tabs.Screen name="consultation/[appointmentId]" options={{ href: null }} />
      <Tabs.Screen name="skill/[id]" options={{ href: null }} />
      
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Skills',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'construct' : 'construct-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'calendar' : 'calendar-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          title: 'Availability',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'time' : 'time-outline'} color={color} size={24} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function RootLayout() {
  const [session, setSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // fetch user role when session available
  useEffect(() => {
    if (!session?.user) {
      setRole(null);
      return;
    }

    let isMounted = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      if (!isMounted) return;
      setRole(error ? null : data?.role ?? null);
    })();
    return () => {
      isMounted = false;
    };
  }, [session]);

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = segments[0] as string;
    const inAuthGroup = firstSegment === 'auth';
    const inTabsGroup = firstSegment === '(tabs)';
    const inDoctorsDetail = firstSegment === 'doctors';
    const inDoctorGroup = firstSegment === '(doctor)';
    const inModalsGroup = firstSegment === '(modals)';
  // Allow standalone Checkout screen to bypass redirects
    const inCheckout = firstSegment === 'checkout';
    // Root ("/") is the public landing page – treat it as its own group
    const inLandingGroup = firstSegment === undefined || firstSegment === '';

    if (!session && !inAuthGroup && !inLandingGroup) {
      router.replace('/');
      return;
    }

    if (!session || role === null) return; // wait until role fetched

    if (role === 'doctor') {
      if (!inDoctorGroup && !inModalsGroup && !inCheckout) router.replace('/(doctor)' as any);
    } else {
      if (!inTabsGroup && !inModalsGroup && !inCheckout && !inDoctorsDetail) router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

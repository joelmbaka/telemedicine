import { Button, Input } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function AccountScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [isFetching, setIsFetching] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted) setSession(session);
    });
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) setSession(session);
    });
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  useEffect(() => {
    if (session) {
      getProfile();
    }
  }, [session]);

  async function getProfile() {
    try {
      setIsFetching(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, website, avatar_url`)
        .eq('id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username || '');
        setWebsite(data.website || '');
        setAvatarUrl(data.avatar_url || '');
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setIsFetching(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setIsUpdating(true);
      if (!session?.user) throw new Error('No user on the session!');

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from('profiles').upsert(updates);

      if (error) {
        throw error;
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setIsUpdating(false);
    }
  }

  if (!session) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1d23' }}>
        <ActivityIndicator color="#64d2ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Input 
          label="Email" 
          value={session?.user?.email ?? ''} 
          disabled 
          labelStyle={{ color: '#fff' }}
          inputStyle={{ color: '#fff' }}
          inputContainerStyle={{ borderColor: '#64d2ff' }}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input 
          label="Username" 
          value={username} 
          onChangeText={(text) => setUsername(text)} 
          labelStyle={{ color: '#fff' }}
          inputStyle={{ color: '#fff' }}
          inputContainerStyle={{ borderColor: '#64d2ff' }}
        />
      </View>
      <View style={styles.verticallySpaced}>
        <Input 
          label="Website" 
          value={website} 
          onChangeText={(text) => setWebsite(text)} 
          labelStyle={{ color: '#fff' }}
          inputStyle={{ color: '#fff' }}
          inputContainerStyle={{ borderColor: '#64d2ff' }}
        />
      </View>

      <View style={[styles.verticallySpaced, styles.mt20]}>
        <Button
          title={isUpdating ? 'Updating ...' : 'Update'}
          onPress={() => updateProfile({ username, website, avatar_url: avatarUrl })}
          disabled={isUpdating}
          buttonStyle={{ backgroundColor: '#64d2ff' }}
          titleStyle={{ color: '#000' }}
        />
      </View>

      <View style={styles.verticallySpaced}>
        <Button 
          title="Sign Out" 
          onPress={async () => {
            await supabase.auth.signOut();
            router.replace('/');
          }} 
          buttonStyle={{ backgroundColor: '#ff3b30' }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1d23',
    padding: 12,
  },
  verticallySpaced: {
    paddingTop: 4,
    paddingBottom: 4,
    alignSelf: 'stretch',
  },
  mt20: {
    marginTop: 20,
  },
});

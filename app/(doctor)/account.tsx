import { Button, Input, Switch } from '@rneui/themed';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, View, Text, ScrollView } from 'react-native';
import { supabase } from '../../lib/supabase';
import { Session } from '@supabase/supabase-js';

export default function DoctorAccountScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // profile fields
  const [username, setUsername] = useState('');
  const [website, setWebsite] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // doctor fields
  const [bio, setBio] = useState('');
  const [fee, setFee] = useState('');
  const [available, setAvailable] = useState(true);
  const [ratingAvg, setRatingAvg] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [specialtiesList, setSpecialtiesList] = useState<{id:string;name:string;emoji:string;}[]>([]);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (mounted) setSession(session);
    });
    const { data: { subscription }} = supabase.auth.onAuthStateChange((_, s) => {
      if (mounted) setSession(s);
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  async function fetchData() {
    if (!session?.user) return;
    try {
      setLoading(true);
      const uid = session.user.id;
      // profiles
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('username, website, avatar_url')
        .eq('id', uid)
        .single();
      if (profErr) throw profErr;
      if (prof) {
        setUsername(prof.username || '');
        setWebsite(prof.website || '');
        setAvatarUrl(prof.avatar_url || '');
      }
      // doctors
      const { data: doc, error: docErr } = await supabase
        .from('doctors')
        .select('bio, consultation_fee_dollars, available, rating_avg, rating_count, specialties')
        .eq('id', uid)
        .single();
      if (docErr && docErr.code !== 'PGRST116') throw docErr; // maybe not doctor yet
      if (doc) {
        setBio(doc.bio || '');
        setFee(String(doc.consultation_fee_dollars ?? ''));
        setAvailable(doc.available ?? true);
        setRatingAvg(Number(doc.rating_avg) || 0);
        setRatingCount(Number(doc.rating_count) || 0);
        // fetch specialties details
        if (doc.specialties && doc.specialties.length) {
          const { data: specs, error: specErr } = await supabase
            .from('specialties')
            .select('id,name,emoji')
            .in('id', doc.specialties);
          if (specErr) console.error(specErr);
          setSpecialtiesList(specs || []);
        } else {
          setSpecialtiesList([]);
        }
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!session?.user) return;
    try {
      setUpdating(true);
      const uid = session.user.id;
      // update profiles
      const { error: pErr } = await supabase.from('profiles').upsert({
        id: uid,
        username,
        website,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      });
      if (pErr) throw pErr;
      // update doctors
      const feeNum = parseInt(fee, 10) || 0;
      const { error: dErr } = await supabase.from('doctors').upsert({
        id: uid,
        bio,
        consultation_fee_dollars: feeNum,
        available,
      });
      if (dErr) throw dErr;
      Alert.alert('Success', 'Profile updated');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUpdating(false);
    }
  }

  if (!session || loading) {
    return (
      <View style={styles.center}><ActivityIndicator color="#64d2ff" /></View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.heading}>Account</Text>
      {/* Profile */}
      <Input label="Email" value={session.user.email!} disabled inputContainerStyle={styles.noBorder} labelStyle={{color:'#fff'}} inputStyle={{color:'#fff'}} />
      <Input label="Username" value={username} onChangeText={setUsername} labelStyle={{color:'#fff'}} inputStyle={{color:'#fff'}} inputContainerStyle={styles.noBorder} />
      <Input label="Website" value={website} onChangeText={setWebsite} labelStyle={{color:'#fff'}} inputStyle={{color:'#fff'}} inputContainerStyle={styles.noBorder} />

      {/* Doctor specific */}
      <Input label="Bio" value={bio} onChangeText={setBio} multiline labelStyle={{color:'#fff'}} inputStyle={{color:'#fff'}} inputContainerStyle={styles.noBorder} />
      <Input label="Consultation Fee ($)" value={fee} onChangeText={setFee} keyboardType="numeric" labelStyle={{color:'#fff'}} inputStyle={{color:'#fff'}} inputContainerStyle={styles.noBorder} />
      <View style={{ flexDirection:'row', alignItems:'center', marginBottom:12 }}>
        <Text style={{color:'#fff', marginRight:8}}>Available</Text>
        <Switch value={available} onValueChange={setAvailable} />
      </View>
      <Text style={styles.sectionHeader}>Specialties</Text>
      <View style={styles.specList}>
        {specialtiesList.map(spec => (
          <View key={spec.id} style={styles.specChip}>
            <Text style={styles.specEmoji}>{spec.emoji}</Text>
            <Text style={styles.specName}>{spec.name}</Text>
          </View>
        ))}
        {specialtiesList.length === 0 && (
          <Text style={{color:'#fff'}}>No specialties set</Text>
        )}
      </View>

      <Text style={{color:'#fff', marginBottom:8}}>Rating: {ratingAvg.toFixed(1)} ({ratingCount})</Text>

      <Button title={updating ? 'Updating...' : 'Save'} onPress={handleSave} disabled={updating} buttonStyle={{ backgroundColor: '#64d2ff' }} titleStyle={{ color: '#000' }} />
      <Button title="Sign Out" onPress={async()=>{await supabase.auth.signOut();router.replace('/');}} buttonStyle={{ backgroundColor: '#ff3b30', marginTop:12 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1d23',
    padding: 12,
  },
  noBorder: {
    borderBottomWidth: 0,
  },
  center: {
    flex:1,
    alignItems:'center',
    justifyContent:'center',
    backgroundColor:'#1a1d23'
  },
  sectionHeader: {
    color:'#fff',
    fontSize:16,
    fontWeight:'600',
    marginBottom:4,
  },
  specList: {
    flexDirection:'row',
    flexWrap:'wrap',
    marginBottom:12,
  },
  specChip: {
    flexDirection:'row',
    alignItems:'center',
    backgroundColor:'#2c3e50',
    paddingHorizontal:8,
    paddingVertical:4,
    borderRadius:16,
    marginRight:6,
    marginBottom:6,
  },
  specEmoji: {
    fontSize:14,
    marginRight:4,
  },
  specName: {
    color:'#fff',
    fontSize:14,
  }
});

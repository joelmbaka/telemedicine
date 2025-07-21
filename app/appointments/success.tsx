import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';

export default function PaymentSuccess() {
  const router = useRouter();
  
  const handleRedirect = () => {
    // Use absolute path for web, keep tabs structure for mobile
    const path = Platform.OS === 'web' ? '/appointments' : '/(tabs)/appointments';
    // Push instead of replace for better web behavior
    router.push(path);
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Payment Successful!</Text>
      <Text>Your appointment has been confirmed.</Text>
      <Button title="Back to Appointments" onPress={handleRedirect} />
    </View>
  );
}

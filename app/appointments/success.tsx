import { View, Text, Button } from 'react-native';
import { useRouter } from 'expo-router';

export default function PaymentSuccess() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Payment Successful!</Text>
      <Text>Your appointment has been confirmed.</Text>
      <Button title="Back to Appointments" onPress={() => router.push('/appointments')} />
    </View>
  );
}

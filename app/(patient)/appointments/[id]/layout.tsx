import { Stack } from 'expo-router';

export default function AppointmentLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Appointment Detail' }} />
    </Stack>
  );
}

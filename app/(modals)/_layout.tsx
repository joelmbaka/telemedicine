import { Stack } from 'expo-router';

export default function ModalsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Transparent modal only for skill detail */}
      <Stack.Screen
        name="skill/[id]"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      />
      {/* Other modals inherit default presentation with header hidden */}
      <Stack.Screen name="new-appointment" />
      <Stack.Screen name="doctor-onboarding" />
      <Stack.Screen name="edit-skill" />
    </Stack>
  );
}

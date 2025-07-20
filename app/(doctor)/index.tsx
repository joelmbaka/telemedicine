import { Redirect } from 'expo-router';

// This screen ensures that navigating to "/(doctor)" will automatically show the first tab (Schedule)
// instead of falling back to the 404 "Go back to Home" screen.
export default function DoctorIndex() {
  return <Redirect href="/(doctor)/schedule" />;
}

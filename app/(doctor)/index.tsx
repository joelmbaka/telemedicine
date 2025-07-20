import { Redirect } from 'expo-router';

// Root of the (doctor) group – immediately send user to first tab (schedule).
// Because (doctor)/_layout.tsx explicitly lists tabs, this route will NOT appear
// as its own tab; it just prevents a 404 when navigating to / (doctor).
export default function DoctorRootRedirect() {
  return <Redirect href="/(doctor)/schedule" />;
}

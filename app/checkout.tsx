import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

export default function CheckoutScreen() {
  const { url } = useLocalSearchParams<{ url: string }>();
  const router = useRouter();

  if (!url) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleNavChange = (navState: any) => {
    const currentUrl: string = navState.url;

    // Detect success or cancel redirect from Stripe Checkout
    // Adjust this logic according to the URLs you set in success_url/cancel_url
    if (currentUrl.includes('/appointments')) {
      // Close the WebView and navigate back to appointments list inside the app
      router.replace('/(tabs)/appointments');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Checkout',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ paddingHorizontal: 12 }}>
              <Ionicons name="arrow-back" size={24} color="#000" />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={{ flex: 1 }}>
        <WebView
          source={{ uri: url as string }}
          startInLoadingState
          renderLoading={() => (
            <ActivityIndicator style={{ flex: 1 }} size="large" />
          )}
          onNavigationStateChange={handleNavChange}
        />
      </View>
    </>
  );
}

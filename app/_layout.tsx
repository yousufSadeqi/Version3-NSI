import { StyleSheet, View } from 'react-native';
import React from 'react';
import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/authContext';
import { ThemeProvider } from '@/contexts/themeContext';

const StackLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="(modals)/profileModal" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="(modals)/WalletModal" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="(modals)/transactionModal" 
        options={{ presentation: 'modal' }} 
      />
      <Stack.Screen 
        name="(modals)/searchModal" 
        options={{ presentation: 'modal' }} 
      />
    </Stack>
  );
};

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StackLayout />
      </AuthProvider>
    </ThemeProvider>
  );
}
const styles = StyleSheet.create({});


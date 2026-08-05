import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { useColors } from '@/hooks/useColors';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Mantener el splash visible hasta que la app esté lista
SplashScreen.preventAutoHideAsync();

// StatusBar y colores viven aquí, dentro de AppProvider
function RootWithTutorial() {
  const { showTutorial, dismissTutorial, isLoading } = useApp();
  const C = useColors();

  // Ocultar el splash en cuanto termina de cargar
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex:1, backgroundColor: C.bg, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color={C.info} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" backgroundColor={C.bg} />
      <Stack screenOptions={{ headerShown: false }} />
      <TutorialOverlay visible={showTutorial} onDone={(dontShow) => dismissTutorial(dontShow)} />
    </>
  );
}

// RootLayout solo provee contexto — no usa C
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootWithTutorial />
      </AppProvider>
    </SafeAreaProvider>
  );
}

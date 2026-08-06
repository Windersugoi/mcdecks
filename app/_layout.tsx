import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { useColors } from '@/hooks/useColors';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

// Ocultar el splash del sistema lo antes posible — usaremos el nuestro
SplashScreen.preventAutoHideAsync();

const { width, height } = Dimensions.get('screen');

function RootWithTutorial() {
  const { showTutorial, dismissTutorial, isLoading } = useApp();
  const C = useColors();

  useEffect(() => {
    // Ocultar el splash del sistema en cuanto podamos
    SplashScreen.hideAsync();
  }, []);

  // Mientras carga: mostrar nuestro propio splash a pantalla completa
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <Image
          source={require('../../assets/splash.png')}
          style={styles.splashImage}
          resizeMode="cover"
        />
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

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  splashImage: {
    width,
    height,
  },
});

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootWithTutorial />
      </AppProvider>
    </SafeAreaProvider>
  );
}

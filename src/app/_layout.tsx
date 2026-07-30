import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { DarkColors, LightColors } from '@/styles/theme';

function RootWithTutorial() {
  const { showTutorial, dismissTutorial, isLoading, lightMode } = useApp();
  const C = lightMode ? LightColors : DarkColors;

  if (isLoading) {
    return (
      <View style={{ flex:1, backgroundColor: C.bg, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color={C.info} />
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor: C.bg }}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }} />
      <TutorialOverlay visible={showTutorial} onDone={(dontShow) => dismissTutorial(dontShow)} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="auto" />
        <RootWithTutorial />
      </AppProvider>
    </SafeAreaProvider>
  );
}

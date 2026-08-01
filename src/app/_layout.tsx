import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { useColors } from '@/hooks/useColors';

function RootWithTutorial() {
  const { showTutorial, dismissTutorial, isLoading } = useApp();
  const C = useColors();

  if (isLoading) {
    return (
      <View style={{ flex:1, backgroundColor: C.bg, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color={C.info} />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <TutorialOverlay visible={showTutorial} onDone={(dontShow) => dismissTutorial(dontShow)} />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <StatusBar style="light" backgroundColor={C.bg} />
        <RootWithTutorial />
      </AppProvider>
    </SafeAreaProvider>
  );
}

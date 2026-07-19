import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { TutorialOverlay } from '@/components/TutorialOverlay';

function RootWithTutorial() {
  const { showTutorial, dismissTutorial, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex:1, backgroundColor:'#0f0f0d', justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color="#378ADD" />
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
        <StatusBar style="light" backgroundColor="#0f0f0d" />
        <RootWithTutorial />
      </AppProvider>
    </SafeAreaProvider>
  );
}

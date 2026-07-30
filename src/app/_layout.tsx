import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, ActivityIndicator } from 'react-native';
import { AppProvider, useApp } from '@/context/AppContext';
import { TutorialOverlay } from '@/components/TutorialOverlay';
import { Colors } from '@/styles/theme';

function RootWithTutorial() {
  const { showTutorial, dismissTutorial, isLoading } = useApp();

  if (isLoading) {
    return (
      <View style={{ flex:1, backgroundColor: Colors.bg, justifyContent:'center', alignItems:'center' }}>
        <ActivityIndicator size="large" color={Colors.info} />
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
        <StatusBar style="light" backgroundColor={Colors.bg} />
        <RootWithTutorial />
      </AppProvider>
    </SafeAreaProvider>
  );
}

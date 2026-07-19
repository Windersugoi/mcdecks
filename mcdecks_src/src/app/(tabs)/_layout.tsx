import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Colors } from "@/styles/theme";

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarIcon: () => null,
      tabBarIconStyle: { display: "none" },
      tabBarStyle: {
        backgroundColor: Colors.surface,
        borderTopColor: Colors.border, borderTopWidth: 1,
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom, paddingTop: 8,
      },
      tabBarActiveTintColor: Colors.text,
      tabBarInactiveTintColor: Colors.textMuted,
      tabBarLabelStyle: { fontSize: 13, fontWeight: "600" },
      tabBarShowLabel: true,
    }}>
      <Tabs.Screen name="mazos"    options={{ title: "Mazos",        tabBarIcon: () => null }} />
      <Tabs.Screen name="villanos" options={{ title: "Villanos",     tabBarIcon: () => null }} />
      <Tabs.Screen name="campanas" options={{ title: "Campañas",     tabBarIcon: () => null }} />
      <Tabs.Screen name="cuenta"   options={{ title: "Mi Colección", tabBarIcon: () => null }} />
    </Tabs>
  );
}

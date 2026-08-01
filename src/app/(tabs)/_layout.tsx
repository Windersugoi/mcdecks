import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

export default function TabsLayout() {
  const C = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarIcon: () => null,
      tabBarIconStyle: { display: "none" },
      tabBarStyle: {
        backgroundColor: C.surface,
        borderTopColor: C.border, borderTopWidth: 1,
        height: 52 + insets.bottom,
        paddingBottom: insets.bottom, paddingTop: 8,
      },
      tabBarActiveTintColor: C.text,
      tabBarInactiveTintColor: C.textMuted,
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

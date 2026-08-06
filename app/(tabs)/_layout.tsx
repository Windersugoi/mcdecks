import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useApp } from "@/context/AppContext";
import { t } from "@/i18n/strings";

export default function TabsLayout() {
  const { lang } = useApp();
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
      <Tabs.Screen name="mazos"    options={{ title: t(lang,"decks"),      tabBarIcon: () => null }} />
      <Tabs.Screen name="villanos" options={{ title: t(lang,"villains"),   tabBarIcon: () => null }} />
      <Tabs.Screen name="campanas" options={{ title: t(lang,"campaigns"),  tabBarIcon: () => null }} />
      <Tabs.Screen name="cuenta"   options={{ title: t(lang,"collection"), tabBarIcon: () => null }} />
      <Tabs.Screen name="ajustes"  options={{ title: t(lang,"settings"),   tabBarIcon: () => null }} />
    </Tabs>
  );
}

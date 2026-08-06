import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable, Linking } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { t, Lang } from '@/i18n/strings';

const KOFI_URL = 'https://ko-fi.com/mcdecks';
const APP_VERSION = '1.0.0';

const LANGUAGES: { code: Lang; label: string; flag: string }[] = [
  { code: 'es', label: 'Español',   flag: '🇪🇸' },
  { code: 'en', label: 'English',   flag: '🇬🇧' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷' },
  { code: 'it', label: 'Italiano',  flag: '🇮🇹' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
];

export default function AjustesScreen() {
  const { lightMode, setLightMode, lang, setLang, dismissTutorial } = useApp();
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <Text style={s.screenTitle}>{t(lang, 'settingsTitle')}</Text>

      {/* Apariencia */}
      <Text style={s.sectionLabel}>{t(lang, 'appearance')}</Text>
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.rowLabel}>{t(lang, 'darkMode')}</Text>
          <Switch
            value={!lightMode}
            onValueChange={v => setLightMode(!v)}
            trackColor={{ false: C.border, true: C.info }}
            thumbColor={C.text}
          />
        </View>
      </View>

      {/* Idioma */}
      <Text style={s.sectionLabel}>{t(lang, 'language')}</Text>
      <View style={s.card}>
        <View style={s.langGrid}>
          {LANGUAGES.map(({ code, label, flag }) => (
            <Pressable
              key={code}
              style={[s.langBtn, lang === code && s.langBtnActive]}
              onPress={() => setLang(code)}>
              <Text style={s.langFlag}>{flag}</Text>
              <Text style={[s.langBtnTxt, lang === code && s.langBtnTxtActive]}>{label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Ko-fi */}
      <Text style={s.sectionLabel}>{t(lang, 'support')}</Text>
      <View style={s.kofiCard}>
        <Text style={s.kofiDesc}>{t(lang, 'supportDesc')}</Text>
        <Pressable style={s.kofiBtn} onPress={() => Linking.openURL(KOFI_URL).catch(() => {})}>
          <Text style={s.kofiBtnTxt}>{'\u2615\ufe0f'}  {t(lang, 'supportBtn')}</Text>
        </Pressable>
      </View>

      {/* Acerca de */}
      <Text style={s.sectionLabel}>{t(lang, 'about')}</Text>
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.rowLabel}>{t(lang, 'aboutVersion')}</Text>
          <Text style={s.rowValue}>{APP_VERSION}</Text>
        </View>
        <View style={[s.row, s.rowBorder]}>
          <Text style={s.rowLabel}>{t(lang, 'aboutHero')}</Text>
        </View>
        <Pressable style={[s.row, s.rowBorder]} onPress={() => dismissTutorial(false)}>
          <Text style={[s.rowLabel, { color: C.info }]}>{t(lang, 'tutorial')}</Text>
          <Text style={{ color: C.info }}>{'\u2192'}</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
    scroll:           { flex: 1, backgroundColor: C.bg },
    container:        { padding: Spacing.lg, gap: Spacing.sm },
    screenTitle:      { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: Spacing.sm },
    sectionLabel:     { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginTop: Spacing.md },
    card:             { backgroundColor: C.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    row:              { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: Spacing.md },
    rowBorder:        { borderTopWidth: 1, borderTopColor: C.border },
    rowLabel:         { fontSize: 15, color: C.text, flex: 1 },
    rowValue:         { fontSize: 14, color: C.textMuted },
    langGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, padding: Spacing.sm },
    langBtn:          { flexBasis: '47%', flexGrow: 1, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', flexDirection: 'row', gap: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
    langBtnActive:    { borderColor: C.info, backgroundColor: C.info + '22' },
    langFlag:         { fontSize: 18 },
    langBtnTxt:       { fontSize: 13, color: C.textMuted, fontWeight: '600' },
    langBtnTxtActive: { color: C.info },
    kofiCard:         { backgroundColor: '#FF5E5B18', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#FF5E5B55', padding: Spacing.lg, gap: Spacing.md },
    kofiDesc:         { fontSize: 14, color: C.text, lineHeight: 21 },
    kofiBtn:          { backgroundColor: '#FF5E5B', borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center' },
    kofiBtnTxt:       { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}

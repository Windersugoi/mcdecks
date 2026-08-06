import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable, Linking } from 'react-native';
import { useApp } from '@/context/AppContext';
import { useColors } from '@/hooks/useColors';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { t } from '@/i18n/strings';

const KOFI_URL = 'https://ko-fi.com/mcdecks';
const APP_VERSION = '1.0.0';

export default function AjustesScreen() {
  const { lightMode, setLightMode, lang, setLang, dismissTutorial } = useApp();
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);

  function openKofi() {
    Linking.openURL(KOFI_URL).catch(() => {});
  }

  function replayTutorial() {
    dismissTutorial(false); // false = show tutorial again
  }

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
        <View style={s.langRow}>
          <Pressable
            style={[s.langBtn, lang === 'es' && s.langBtnActive]}
            onPress={() => setLang('es')}>
            <Text style={[s.langBtnTxt, lang === 'es' && s.langBtnTxtActive]}>🇪🇸  Español</Text>
          </Pressable>
          <Pressable
            style={[s.langBtn, lang === 'en' && s.langBtnActive]}
            onPress={() => setLang('en')}>
            <Text style={[s.langBtnTxt, lang === 'en' && s.langBtnTxtActive]}>🇬🇧  English</Text>
          </Pressable>
        </View>
      </View>

      {/* Ko-fi */}
      <Text style={s.sectionLabel}>{t(lang, 'support')}</Text>
      <View style={s.kofiCard}>
        <Text style={s.kofiDesc}>{t(lang, 'supportDesc')}</Text>
        <Pressable style={s.kofiBtn} onPress={openKofi}>
          <Text style={s.kofiBtnTxt}>☕  {t(lang, 'supportBtn')}</Text>
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
        <Pressable style={[s.row, s.rowBorder]} onPress={replayTutorial}>
          <Text style={[s.rowLabel, { color: C.info }]}>{t(lang, 'tutorial')}</Text>
          <Text style={{ color: C.info }}>→</Text>
        </Pressable>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
    scroll:          { flex: 1, backgroundColor: C.bg },
    container:       { padding: Spacing.lg, gap: Spacing.sm },
    screenTitle:     { fontSize: 24, fontWeight: '800', color: C.text, marginBottom: Spacing.sm },
    sectionLabel:    { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 0.8, marginTop: Spacing.md },
    card:            { backgroundColor: C.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
    row:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: Spacing.md },
    rowBorder:       { borderTopWidth: 1, borderTopColor: C.border },
    rowLabel:        { fontSize: 15, color: C.text, flex: 1 },
    rowValue:        { fontSize: 14, color: C.textMuted },
    langRow:         { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.sm },
    langBtn:         { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface2 },
    langBtnActive:   { borderColor: C.info, backgroundColor: C.info + '22' },
    langBtnTxt:      { fontSize: 14, color: C.textMuted, fontWeight: '600' },
    langBtnTxtActive:{ color: C.info },
    kofiCard:        { backgroundColor: '#FF5E5B' + '18', borderRadius: Radius.lg, borderWidth: 1, borderColor: '#FF5E5B' + '55', padding: Spacing.lg, gap: Spacing.md },
    kofiDesc:        { fontSize: 14, color: C.text, lineHeight: 21 },
    kofiBtn:         { backgroundColor: '#FF5E5B', borderRadius: Radius.md, paddingVertical: 13, alignItems: 'center' },
    kofiBtnTxt:      { color: '#fff', fontSize: 15, fontWeight: '700' },
  });
}

import React, { useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions } from 'react-native';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';
import { useApp } from '@/context/AppContext';
import { t } from '@/i18n/strings';

const { width } = Dimensions.get('window');

interface Props { visible: boolean; onDone: (dontShow: boolean) => void; }

export function TutorialOverlay({ visible, onDone }: Props) {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const { lang } = useApp();
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);

  const STEPS = [
    { icon: '🃏', tab: t(lang,'tut1Tab'), title: t(lang,'tut1Title'), body: t(lang,'tut1Body') },
    { icon: '⭐', tab: t(lang,'tut2Tab'), title: t(lang,'tut2Title'), body: t(lang,'tut2Body') },
    { icon: '📌', tab: t(lang,'tut3Tab'), title: t(lang,'tut3Title'), body: t(lang,'tut3Body') },
    { icon: '🦹', tab: t(lang,'tut4Tab'), title: t(lang,'tut4Title'), body: t(lang,'tut4Body') },
    { icon: '📖', tab: t(lang,'tut5Tab'), title: t(lang,'tut5Title'), body: t(lang,'tut5Body') },
    { icon: '📦', tab: t(lang,'tut6Tab'), title: t(lang,'tut6Title'), body: t(lang,'tut6Body') },
    { icon: '⚙️', tab: t(lang,'tut7Tab'), title: t(lang,'tut7Title'), body: t(lang,'tut7Body') },
  ];

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function handleDone() { onDone(dontShow); setStep(0); }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleDone}>
      <View style={s.overlay}>
        <View style={s.card}>
          <View style={s.header}>
            <Text style={s.icon}>{current.icon}</Text>
            <View style={s.headerText}>
              <Text style={s.tabLabel}>{current.tab}</Text>
              <Text style={s.title}>{current.title}</Text>
            </View>
          </View>
          <Text style={s.body}>{current.body}</Text>
          <View style={s.dotsRow}>
            {STEPS.map((_, i) => (
              <View key={i} style={[s.dot, i === step && s.dotActive]} />
            ))}
          </View>
          <Pressable style={s.checkRow} onPress={() => setDontShow(v => !v)}>
            <View style={[s.checkbox, dontShow && s.checkboxOn]}>
              {dontShow && <Text style={s.checkMark}>✓</Text>}
            </View>
            <Text style={s.checkLabel}>{t(lang, 'dontShowAgain')}</Text>
          </Pressable>
          <View style={s.btnRow}>
            <Pressable onPress={handleDone} style={s.skipBtn}>
              <Text style={s.skipTxt}>{t(lang, 'skip')}</Text>
            </Pressable>
            <Pressable
              onPress={isLast ? handleDone : () => setStep(n => n + 1)}
              style={s.nextBtn}>
              <Text style={s.nextTxt}>
                {isLast ? t(lang, 'getStarted') : t(lang, 'next')}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
    overlay:    { flex:1, backgroundColor:'rgba(0,0,0,0.88)', justifyContent:'center', alignItems:'center', padding:Spacing.xl },
    card:       { backgroundColor:C.surface, borderRadius:Radius.lg, borderWidth:1, borderColor:C.borderStrong, width:Math.min(width-48,360), padding:Spacing.lg, gap:Spacing.md },
    header:     { flexDirection:'row', alignItems:'center', gap:14 },
    icon:       { fontSize:38 },
    headerText: { flex:1, gap:2 },
    tabLabel:   { fontSize:11, color:C.info, fontWeight:'700', letterSpacing:0.5, textTransform:'uppercase' },
    title:      { fontSize:19, fontWeight:'700', color:C.text },
    body:       { fontSize:14, color:C.textSub, lineHeight:22 },
    dotsRow:    { flexDirection:'row', justifyContent:'center', gap:6, paddingVertical:4 },
    dot:        { width:7, height:7, borderRadius:4, backgroundColor:C.borderStrong },
    dotActive:  { backgroundColor:C.info, width:18 },
    checkRow:   { flexDirection:'row', alignItems:'center', gap:10 },
    checkbox:   { width:20, height:20, borderRadius:4, borderWidth:1.5, borderColor:C.borderStrong, justifyContent:'center', alignItems:'center' },
    checkboxOn: { backgroundColor:C.info, borderColor:C.info },
    checkMark:  { color:'#fff', fontSize:12, fontWeight:'700' },
    checkLabel: { fontSize:13, color:C.textMuted },
    btnRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    skipBtn:    { padding:Spacing.sm },
    skipTxt:    { fontSize:13, color:C.textMuted },
    nextBtn:    { backgroundColor:C.info, borderRadius:Radius.md, paddingVertical:10, paddingHorizontal:24 },
    nextTxt:    { fontSize:14, fontWeight:'700', color:'#fff' },
  });
}

import React, { useMemo, useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, Dimensions } from 'react-native';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';

const { width } = Dimensions.get('window');

const STEPS = [
  { icon:'🃏', tab:'Mazos', title:'Your Decks',
    body:'Here you\'ll find all your decks. Tap "+ New Deck" to build one — choose a hero, pick an aspect, and add cards from your collection. You can also import directly from marvelcdb.' },
  { icon:'★', tab:'Mazos', title:'Active Deck',
    body:'Tap the ☆ star on any deck to make it your Active Deck. Your villain defeats and campaign progress are tracked per active deck. Change it anytime.' },
  { icon:'📦', tab:'Mi Colección', title:'My Collection',
    body:'Enable the sets and packs you own. The deck builder will only show cards you have available, and will warn you if a card is missing from your collection.' },
  { icon:'🦹', tab:'Villains', title:'Villain Tracker',
    body:'Track which villains you\'ve defeated and with which deck. Checkboxes are always linked to your Active Deck — switch decks to track progress for each hero separately.' },
  { icon:'📖', tab:'Campaigns', title:'Campaigns',
    body:'Follow official campaigns step by step, create custom ones, or generate a random encounter. Campaign progress is also tracked per active deck.' },
];

interface Props { visible: boolean; onDone: (dontShow: boolean) => void; }

export function TutorialOverlay({
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]); visible, onDone }: Props) {
  const [step, setStep] = useState(0);
  const [dontShow, setDontShow] = useState(false);
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
            {STEPS.map((_,i) => <View key={i} style={[s.dot, i===step && s.dotActive]} />)}
          </View>
          {/* Don't show again */}
          <Pressable style={s.checkRow} onPress={() => setDontShow(v=>!v)}>
            <View style={[s.checkbox, dontShow && s.checkboxOn]}>
              {dontShow && <Text style={s.checkMark}>✓</Text>}
            </View>
            <Text style={s.checkLabel}>Don't show this again</Text>
          </Pressable>
          <View style={s.btnRow}>
            <Pressable onPress={handleDone} style={s.skipBtn}>
              <Text style={s.skipTxt}>Skip</Text>
            </Pressable>
            <Pressable onPress={isLast ? handleDone : () => setStep(s=>s+1)} style={s.nextBtn}>
              <Text style={s.nextTxt}>{isLast ? 'Get started' : 'Next →'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
  overlay:{ flex:1, backgroundColor:'rgba(0,0,0,0.88)', justifyContent:'center', alignItems:'center', padding:Spacing.xl },
  card:{ backgroundColor:C.surface, borderRadius:Radius.lg, borderWidth:1, borderColor:C.borderStrong, width:Math.min(width-48,360), padding:Spacing.lg, gap:Spacing.md },
  header:{ flexDirection:'row', alignItems:'center', gap:14 },
  icon:{ fontSize:38 },
  headerText:{ flex:1, gap:2 },
  tabLabel:{ fontSize:11, color:C.info, fontWeight:'700', letterSpacing:0.5, textTransform:'uppercase' },
  title:{ fontSize:19, fontWeight:'700', color:C.text },
  body:{ fontSize:14, color:C.textSub, lineHeight:22 },
  dotsRow:{ flexDirection:'row', justifyContent:'center', gap:8, paddingVertical:4 },
  dot:{ width:8, height:8, borderRadius:4, backgroundColor:C.borderStrong },
  dotActive:{ backgroundColor:C.info, width:20 },
  checkRow:{ flexDirection:'row', alignItems:'center', gap:10 },
  checkbox:{ width:20, height:20, borderRadius:4, borderWidth:1.5, borderColor:C.borderStrong, justifyContent:'center', alignItems:'center' },
  checkboxOn:{ backgroundColor:C.info, borderColor:C.info },
  checkMark:{ color:'#fff', fontSize:12, fontWeight:'700' },
  checkLabel:{ fontSize:13, color:C.textMuted },
  btnRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  skipBtn:{ padding:Spacing.sm },
  skipTxt:{ fontSize:13, color:C.textMuted },
  nextBtn:{ backgroundColor:C.info, borderRadius:Radius.md, paddingVertical:10, paddingHorizontal:24 },
  nextTxt:{ fontSize:14, fontWeight:'700', color:'#fff' },
});
}

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';
import { Deck } from '@/data/types';
import { deckTitleColor } from '@/utils/deckUtils';
export function ActiveDeckBanner({
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]); activeDeck, warn }: { activeDeck: Deck | null; warn?: string }) {
  if (!activeDeck) return (
    <View style={s.warn}><Text style={s.warnTxt}>{warn ?? '★ Activate a deck in Mazos (☆) to track progress here.'}</Text></View>
  );
  const color = deckTitleColor(activeDeck);
  return (
    <View style={[s.banner,{borderColor:color+'55'}]}>
      <Text style={s.label}>Active deck: </Text>
      <Text style={[s.name,{color}]}>{activeDeck.name}</Text>
    </View>
  );
}
function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
  banner:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:C.surface},
  label:{fontSize:12,color:C.textMuted},
  name:{fontSize:12,fontWeight:'600'},
  warn:{borderWidth:1,borderColor:C.warning+'55',backgroundColor:'#1a1800',borderRadius:Radius.md,padding:Spacing.sm},
  warnTxt:{fontSize:12,color:C.warning},
});
}

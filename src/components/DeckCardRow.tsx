import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, Deck } from '@/data/types';
import { usedElsewhere, aspectColor } from '@/utils/deckUtils';
import { displayAspect } from '@/data/constants';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';

interface Props {
  card: Card; qty: number; decks: Deck[]; deckId: string;
  deckFull: boolean; onChange: (d: number) => void;
  onPreview: (c: Card) => void; setName?: string;
}

export function DeckCardRow({ card, qty, decks, deckId, deckFull, onChange, onPreview, setName }: Props) {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);

  const elsewhere = usedElsewhere(decks, card.id, deckId);
  const elseQty = elsewhere.reduce((a, u) => a + u.qty, 0);
  const notOwned = card.owned === 0;
  const overUsed = !notOwned && card.owned < qty + elseQty;
  const missing = notOwned || overUsed;
  const maxReached = qty >= (card.maxPerDeck ?? 4) || deckFull;

  return (
    <View style={[s.row, missing && s.rowDanger]}>
      <Pressable style={s.info} onPress={() => onPreview(card)}>
        <Text style={s.name}>
          {card.name}
          {card.aspect && card.aspect !== 'Basic'
            ? <Text style={{ color: aspectColor(card.aspect), fontSize: 11 }}> ({displayAspect(card.aspect)})</Text>
            : null}
        </Text>
        {notOwned && <Text style={s.err}>Not in collection{setName ? ` (${setName})` : ''}</Text>}
        {overUsed && (
          <Text style={s.err}>
            Need {qty + elseQty - card.owned} more · used in: {elsewhere.map(u => `${u.qty}x "${u.deckName}"`).join(' · ')}
          </Text>
        )}
        {!missing && elseQty > 0 && (
          <Text style={s.warn}>{elseQty} also in: {elsewhere.map(u => `"${u.deckName}"`).join(', ')}</Text>
        )}
      </Pressable>
      <View style={s.qtyRow}>
        <Pressable onPress={() => onChange(-1)} style={s.btn}>
          <Text style={s.btnTxt}>−</Text>
        </Pressable>
        <Text style={s.qty}>{qty}</Text>
        <Pressable onPress={() => !maxReached && onChange(1)} style={[s.btn, maxReached && s.btnOff]}>
          <Text style={[s.btnTxt, maxReached && { color: C.borderStrong }]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
    row:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                borderWidth:1, borderColor:C.border, borderRadius:Radius.md,
                padding:Spacing.sm, backgroundColor:C.surface, gap:8, marginBottom:6 },
    rowDanger:{ borderColor:C.danger, backgroundColor:C.dangerBg },
    info:     { flex:1, gap:2 },
    name:     { fontSize:13, color:C.text },
    err:      { fontSize:11, color:C.danger },
    warn:     { fontSize:11, color:C.warning },
    qtyRow:   { flexDirection:'row', alignItems:'center', gap:8 },
    btn:      { width:28, height:28, borderRadius:Radius.sm, borderWidth:1, borderColor:C.borderStrong,
                backgroundColor:C.surface2, justifyContent:'center', alignItems:'center' },
    btnOff:   { opacity:0.35 },
    btnTxt:   { color:C.text, fontSize:18, lineHeight:22 },
    qty:      { color:C.text, fontSize:13, minWidth:18, textAlign:'center' },
  });
}

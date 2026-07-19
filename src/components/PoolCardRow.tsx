import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Card, Deck } from '@/data/types';
import { usedElsewhere, aspectColor } from '@/utils/deckUtils';
import { displayAspect } from '@/data/constants';
import { Colors, Radius, Spacing } from '@/styles/theme';
interface Props { card:Card;decks:Deck[];deckId:string;deckFull:boolean;onAdd:()=>void;onPreview:(c:Card)=>void; }
export function PoolCardRow({ card, decks, deckId, deckFull, onAdd, onPreview }: Props) {
  const elsewhere = usedElsewhere(decks, card.id, deckId);
  const elseQty = elsewhere.reduce((a,u)=>a+u.qty,0);
  const noStock = card.owned===0;
  const conflict = card.owned>0 && Math.max(0,card.owned-elseQty)===0;
  return (
    <View style={[s.row,(noStock||conflict)&&s.rowDanger,noStock&&s.faded]}>
      <Pressable style={s.info} onPress={()=>onPreview(card)}>
        <Text style={s.name}>{card.name}{card.aspect&&card.aspect!=='Basic'?<Text style={{color:aspectColor(card.aspect),fontSize:11}}> ({displayAspect(card.aspect)})</Text>:null}<Text style={s.type}> · {card.type}</Text></Text>
        {noStock&&<Text style={s.err}>Not in collection</Text>}
        {conflict&&<Text style={s.err}>All copies in use: {elsewhere.map(u=>`${u.qty}x "${u.deckName}"`).join(', ')}</Text>}
        {!noStock&&!conflict&&elseQty>0&&<Text style={s.warn}>{elseQty} in use · avail: {Math.max(0,card.owned-elseQty)}</Text>}
      </Pressable>
      <Pressable onPress={!deckFull?onAdd:undefined} style={[s.addBtn,deckFull&&s.addOff]}>
        <Text style={[s.addTxt,deckFull&&{color:Colors.borderStrong}]}>+</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  row:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:Colors.surface,gap:8,marginBottom:6},
  rowDanger:{borderColor:Colors.danger},faded:{opacity:0.7},
  info:{flex:1,gap:2},name:{fontSize:13,color:Colors.text},type:{color:Colors.textMuted,fontSize:11},
  err:{fontSize:11,color:Colors.danger},warn:{fontSize:11,color:Colors.warning},
  addBtn:{width:32,height:32,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.borderStrong,backgroundColor:Colors.surface2,justifyContent:'center',alignItems:'center'},
  addOff:{opacity:0.35},addTxt:{color:Colors.success,fontSize:20,lineHeight:24},
});

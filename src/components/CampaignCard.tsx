import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Campaign, Deck } from '@/data/types';
import { DarkColors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';
import { deckTitleColor } from '@/utils/deckUtils';
interface Props { campaign:Campaign;activeDeck:Deck|null;isMine?:boolean;onToggleEntry:(villain:string)=>void; }
export function CampaignCard({
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]); campaign, activeDeck, isMine=false, onToggleEntry }: Props) {
  const progress = activeDeck?.campaigns?.[campaign.id] ?? { completed:false, entriesCompleted:{} };
  const allDone = campaign.entries.every(e=>progress.entriesCompleted?.[e.villain]);
  return (
    <View style={[s.card,{borderColor:allDone&&activeDeck?C.success+'55':isMine?C.info+'33':C.border}]}>
      <View style={s.header}>
        <Text style={[s.title,isMine&&{color:C.info}]}>{campaign.name}</Text>
        {allDone&&activeDeck&&<Text style={s.done}>✓ Done</Text>}
      </View>
      {campaign.entries.map((e,i)=>{
        const done = progress.entriesCompleted?.[e.villain]??false;
        return (
          <Pressable key={i} style={s.entry} onPress={()=>activeDeck&&onToggleEntry(e.villain)}>
            <View style={[s.cb,done&&s.cbDone]}>{done&&<Text style={s.check}>✓</Text>}</View>
            <View style={{flex:1}}>
              <Text style={[s.villain,done&&{color:C.success,textDecorationLine:'line-through'}]}>{e.villain}</Text>
              {e.stages&&<Text style={s.sub}>Stages {e.stages}</Text>}
              {(e.modular?.length??0)>0&&<Text style={s.sub}>Modulars: {e.modular.join(', ')}</Text>}
            </View>
          </Pressable>
        );
      })}
      {!activeDeck&&<Text style={s.hint}>Activate a deck to track progress.</Text>}
    </View>
  );
}
function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
  card:{borderWidth:1,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:C.surface,gap:4},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4},
  title:{fontSize:14,fontWeight:'600',color:C.text,flex:1},done:{fontSize:11,color:C.success,fontWeight:'600',marginLeft:8},
  entry:{flexDirection:'row',alignItems:'flex-start',gap:10,marginTop:6},
  cb:{width:20,height:20,borderRadius:4,borderWidth:1.5,borderColor:C.borderStrong,justifyContent:'center',alignItems:'center',marginTop:1},
  cbDone:{backgroundColor:C.success,borderColor:C.success},check:{color:'#0f0f0d',fontSize:12,fontWeight:'700'},
  villain:{fontSize:13,color:C.text,fontWeight:'600'},sub:{fontSize:11,color:C.textMuted},
  hint:{fontSize:11,color:C.textMuted,marginTop:8},
});
}

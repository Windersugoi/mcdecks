import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Campaign, Deck } from '@/data/types';
import { Colors, Radius, Spacing } from '@/styles/theme';
import { deckTitleColor } from '@/utils/deckUtils';
interface Props { campaign:Campaign;activeDeck:Deck|null;isMine?:boolean;onToggleEntry:(villain:string)=>void; }
export function CampaignCard({ campaign, activeDeck, isMine=false, onToggleEntry }: Props) {
  const progress = activeDeck?.campaigns?.[campaign.id] ?? { completed:false, entriesCompleted:{} };
  const allDone = campaign.entries.every(e=>progress.entriesCompleted?.[e.villain]);
  return (
    <View style={[s.card,{borderColor:allDone&&activeDeck?Colors.success+'55':isMine?Colors.info+'33':Colors.border}]}>
      <View style={s.header}>
        <Text style={[s.title,isMine&&{color:Colors.info}]}>{campaign.name}</Text>
        {allDone&&activeDeck&&<Text style={s.done}>✓ Done</Text>}
      </View>
      {campaign.entries.map((e,i)=>{
        const done = progress.entriesCompleted?.[e.villain]??false;
        return (
          <Pressable key={i} style={s.entry} onPress={()=>activeDeck&&onToggleEntry(e.villain)}>
            <View style={[s.cb,done&&s.cbDone]}>{done&&<Text style={s.check}>✓</Text>}</View>
            <View style={{flex:1}}>
              <Text style={[s.villain,done&&{color:Colors.success,textDecorationLine:'line-through'}]}>{e.villain}</Text>
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
const s = StyleSheet.create({
  card:{borderWidth:1,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:Colors.surface,gap:4},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4},
  title:{fontSize:14,fontWeight:'600',color:Colors.text,flex:1},done:{fontSize:11,color:Colors.success,fontWeight:'600',marginLeft:8},
  entry:{flexDirection:'row',alignItems:'flex-start',gap:10,marginTop:6},
  cb:{width:20,height:20,borderRadius:4,borderWidth:1.5,borderColor:Colors.borderStrong,justifyContent:'center',alignItems:'center',marginTop:1},
  cbDone:{backgroundColor:Colors.success,borderColor:Colors.success},check:{color:'#0f0f0d',fontSize:12,fontWeight:'700'},
  villain:{fontSize:13,color:Colors.text,fontWeight:'600'},sub:{fontSize:11,color:Colors.textMuted},
  hint:{fontSize:11,color:Colors.textMuted,marginTop:8},
});

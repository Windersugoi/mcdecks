import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { ActiveDeckBanner } from '@/components/ActiveDeckBanner';
import { CampaignCard } from '@/components/CampaignCard';
import { Pill } from '@/components/Pill';
import { StarRating } from '@/components/StarRating';
import { Campaign } from '@/data/types';
import { DEFAULT_CAMPAIGNS_NORMAL, DEFAULT_CAMPAIGNS_EXPERT, COMMUNITY_CAMPAIGNS } from '@/data/campaigns';
import { VILLAIN_LIST, MODULAR_LIST } from '@/data/constants';
import { Colors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';

export default function CampanasScreen() {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const { decks, setDecks, activeDeck, officialCampaigns } = useApp();
  const [section, setSection] = useState<'oficiales'|'crear'|'aleatoria'|'comunidad'>('oficiales');
  const [expertMode, setExpertMode] = useState(false);
  const [myCampaigns, setMyCampaigns] = useState<Campaign[]>([]);
  const [campName, setCampName] = useState('');
  const [campEntries, setCampEntries] = useState<{villain:string;modular:string[]}[]>([]);
  const [draftVillain, setDraftVillain] = useState(VILLAIN_LIST[0]);
  const [draftModular, setDraftModular] = useState<string[]>([]);

  // Campañas oficiales = las de los sets que el usuario posee
  // Siempre incluye Core Set. Se añaden automáticamente al activar un set.
  const baseCampaigns = expertMode ? DEFAULT_CAMPAIGNS_EXPERT : DEFAULT_CAMPAIGNS_NORMAL;
  const official = officialCampaigns.length > 0 ? officialCampaigns : baseCampaigns;
  const community = [...COMMUNITY_CAMPAIGNS].sort((a,b)=>(b.rating??0)-(a.rating??0));

  function toggleModular(m: string) {
    setDraftModular(prev => prev.includes(m) ? prev.filter(x=>x!==m) : [...prev,m]);
  }
  function addEntry() {
    if (!draftVillain) return;
    setCampEntries(prev => [...prev, { villain: draftVillain, modular: [...draftModular] }]);
    setDraftModular([]);
  }
  function saveCampaign() {
    if (!campName.trim() || !campEntries.length) return;
    const nc: Campaign = { id:'custom_'+Date.now(), name:campName.trim(), source:'personal', entries:campEntries };
    setMyCampaigns(prev=>[...prev,nc]);
    setDecks(prev=>prev.map(d=>({...d,campaigns:{...(d.campaigns??{}),[nc.id]:{completed:false,entriesCompleted:{}}}})));
    setCampName(''); setCampEntries([]); setDraftModular([]);
    setSection('oficiales');
  }
  function generateRandom() {
    const vils = [...VILLAIN_LIST].sort(()=>Math.random()-0.5).slice(0,3);
    const mods = [...MODULAR_LIST].sort(()=>Math.random()-0.5);
    setCampEntries(vils.map((v,i)=>({villain:v,modular:mods.slice(i*2,i*2+2)})));
    setCampName('Random Campaign '+new Date().toLocaleDateString());
    setSection('crear');
  }
  function handleToggle(campaign: Campaign, villain: string) {
    if (!activeDeck) return;
    setDecks(prev=>prev.map(d=>{
      if (d.id!==activeDeck.id) return d;
      const pc=d.campaigns?.[campaign.id]??{completed:false,entriesCompleted:{}};
      const nec={...pc.entriesCompleted,[villain]:!pc.entriesCompleted?.[villain]};
      const done=campaign.entries.every(e=>nec[e.villain]);
      return {...d,campaigns:{...d.campaigns,[campaign.id]:{completed:done,entriesCompleted:nec}}};
    }));
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.screenTitle}>Campaigns</Text>
        <ActiveDeckBanner activeDeck={activeDeck} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={s.tabRow}>
            {([['oficiales','Official'],['crear','Create'],['aleatoria','Random'],['comunidad','Community']] as const).map(([k,l])=>(
              <Pressable key={k} onPress={()=>setSection(k as any)}
                style={[s.tabChip,section===k&&s.tabChipActive]}>
                <Text style={[s.tabTxt,section===k&&s.tabTxtActive]}>{l}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        {section==='oficiales' && (
          <>
            {/* Toggle Normal/Expert */}
            <Pressable onPress={()=>setExpertMode(v=>!v)}
              style={[s.diffCard,{borderColor:(expertMode?Colors.danger:Colors.success)+'55'}]}>
              <Text style={s.diffLabel}>Difficulty: </Text>
              <Text style={[s.diffValue,{color:expertMode?Colors.danger:Colors.success}]}>
                {expertMode?'Expert':'Normal'}
              </Text>
              <View style={[s.toggle,{backgroundColor:expertMode?Colors.danger:Colors.borderStrong}]}>
                <View style={[s.toggleThumb,{left:expertMode?20:2}]}/>
              </View>
            </Pressable>
            <Text style={s.groupLabel}>Official campaigns</Text>
            {official.map(c=>(
              <CampaignCard key={c.id} campaign={c} activeDeck={activeDeck}
                onToggleEntry={v=>handleToggle(c,v)}/>
            ))}
            {myCampaigns.length>0&&(
              <>
                <Text style={[s.groupLabel,{marginTop:8}]}>My campaigns</Text>
                {myCampaigns.map(c=>(
                  <CampaignCard key={c.id} campaign={c} activeDeck={activeDeck} isMine
                    onToggleEntry={v=>handleToggle(c,v)}/>
                ))}
              </>
            )}
          </>
        )}

        {section==='crear' && (
          <>
            <TextInput placeholder="Campaign name" placeholderTextColor={Colors.textMuted}
              value={campName} onChangeText={setCampName} style={s.input}/>
            {campEntries.map((e,i)=>(
              <View key={i} style={[s.entryRow,{borderColor:Colors.danger+'55'}]}>
                <View style={{flex:1}}>
                  <Text style={{color:'#D4537E',fontWeight:'600'}}>{e.villain}</Text>
                  {e.modular.length>0&&<Text style={s.sub}>{e.modular.join(', ')}</Text>}
                </View>
                <Pressable onPress={()=>setCampEntries(p=>p.filter((_,j)=>j!==i))}>
                  <Text style={{color:Colors.danger,fontSize:18}}>✕</Text>
                </Pressable>
              </View>
            ))}
            <View style={s.builderCard}>
              <Text style={s.builderLabel}>Select villain</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={{flexDirection:'row',gap:6}}>
                  {VILLAIN_LIST.slice(0,20).map(v=>(
                    <Pill key={v} color="#D4537E" active={draftVillain===v} onPress={()=>setDraftVillain(v)}>{v.length>15?v.slice(0,14)+'…':v}</Pill>
                  ))}
                </View>
              </ScrollView>
              <Text style={[s.builderLabel,{marginTop:10}]}>Modular sets</Text>
              <View style={{flexDirection:'row',flexWrap:'wrap',gap:6}}>
                {MODULAR_LIST.map(m=>(
                  <Pill key={m} color={Colors.warning} active={draftModular.includes(m)} onPress={()=>toggleModular(m)}>{m}</Pill>
                ))}
              </View>
              {draftModular.length>3&&<Text style={{fontSize:11,color:Colors.danger,marginTop:4}}>Recommended: max 3 modulars.</Text>}
              <Pressable onPress={addEntry} style={[s.addBtn,{marginTop:10}]}>
                <Text style={s.addBtnTxt}>+ Add {draftVillain}</Text>
              </Pressable>
            </View>
            <Pressable onPress={saveCampaign}
              style={[s.addBtn,{borderColor:(campName&&campEntries.length)?Colors.success:Colors.borderStrong}]}>
              <Text style={{color:(campName&&campEntries.length)?Colors.success:Colors.textMuted,fontSize:13}}>
                Save to My campaigns
              </Text>
            </Pressable>
          </>
        )}

        {section==='aleatoria' && (
          <>
            <Text style={s.sub}>Generates a campaign with random villains and modulars. You can edit before saving.</Text>
            <Pressable onPress={generateRandom} style={s.addBtn}>
              <Text style={s.addBtnTxt}>🎲 Generate random campaign</Text>
            </Pressable>
          </>
        )}

        {section==='comunidad' && community.map(c=>(
          <View key={c.id} style={s.commCard}>
            <View style={{flexDirection:'row',justifyContent:'space-between'}}>
              <Text style={{fontSize:14,fontWeight:'600',color:Colors.text,flex:1}}>{c.name}</Text>
              <StarRating value={c.rating}/>
            </View>
            <Text style={s.sub}>by {c.author} · {c.votes} votes</Text>
            {c.entries.map((e,i)=><Text key={i} style={s.sub}>· {e.villain}</Text>)}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: typeof import("@/styles/theme").DarkColors) {
  return StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},container:{padding:Spacing.lg,gap:12,paddingBottom:30},
  screenTitle:{fontSize:22,fontWeight:'700',color:C.text},
  tabRow:{flexDirection:'row',gap:6,marginBottom:4},
  tabChip:{paddingVertical:6,paddingHorizontal:14,borderRadius:999,borderWidth:1,borderColor:C.border},
  tabChipActive:{backgroundColor:C.info,borderColor:C.info},
  tabTxt:{fontSize:13,color:C.textMuted},tabTxtActive:{color:'#fff',fontWeight:'600'},
  diffCard:{flexDirection:'row',alignItems:'center',gap:8,borderWidth:1,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:C.surface},
  diffLabel:{fontSize:13,fontWeight:'600',color:C.text},diffValue:{fontSize:13,fontWeight:'600',flex:1},
  toggle:{width:40,height:22,borderRadius:11,position:'relative'},
  toggleThumb:{position:'absolute',top:3,width:16,height:16,borderRadius:8,backgroundColor:C.text},
  groupLabel:{fontSize:12,color:C.textMuted,fontWeight:'600'},
  input:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:Radius.sm,color:C.text,fontSize:14,padding:Spacing.sm},
  entryRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:C.surface},
  builderCard:{borderWidth:1,borderColor:C.border,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:C.surface,gap:6},
  builderLabel:{fontSize:12,color:C.textMuted,fontWeight:'600'},
  addBtn:{borderWidth:1,borderColor:C.borderStrong,borderRadius:Radius.md,padding:10,alignItems:'center',backgroundColor:C.surface2},
  addBtnTxt:{fontSize:13,color:C.text},
  commCard:{borderWidth:1,borderColor:C.border,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:C.surface,gap:4},
  sub:{fontSize:12,color:C.textMuted},
});

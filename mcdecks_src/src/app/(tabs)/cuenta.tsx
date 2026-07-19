import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { SET_CATALOG } from '@/data/cards';
import { Colors, Radius, Spacing } from '@/styles/theme';

const CYCLES = ['Core Set','Cycle 1 — Avengers','Cycle 2 — Galaxy','Cycle 3 — Sinister','Cycle 4 — X-Men','Cycle 5 — X-Force','Agents of S.H.I.E.L.D.','Civil War','Fear No Evil','Modules'];
const TYPE_ICON: Record<string,string> = { box:'📦', hero:'🦸', scenario:'🦹', campaign:'📖', module:'🔧' };

export default function CuentaScreen() {
  const { ownedSets, setOwnedSets } = useApp();
  const byCycle: Record<string, typeof SET_CATALOG> = {};
  for (const s of SET_CATALOG) {
    if (!byCycle[s.cycle]) byCycle[s.cycle] = [];
    byCycle[s.cycle].push(s);
  }
  const totalOwned = SET_CATALOG.filter(s=>ownedSets[s.code]).length;
  const totalCards = SET_CATALOG.filter(s=>ownedSets[s.code]).reduce((a,s)=>a+s.totalCards,0);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Mi Colección</Text>
        <View style={s.infoCard}>
          <Text style={s.infoTitle}>🔒 Coming soon: Cloud Sync</Text>
          <Text style={s.infoTxt}>Google login to sync across devices. Everything saved locally for now.</Text>
        </View>
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statNum}>{totalOwned}</Text><Text style={s.statLabel}>Sets owned</Text></View>
          <View style={s.statCard}><Text style={s.statNum}>{totalCards.toLocaleString()}</Text><Text style={s.statLabel}>Cards available</Text></View>
        </View>
        {CYCLES.map(cycle => {
          const sets = byCycle[cycle];
          if (!sets?.length) return null;
          const own = sets.filter(x=>ownedSets[x.code]).length;
          return (
            <View key={cycle}>
              <View style={s.cycleHeader}>
                <Text style={s.cycleTitle}>{cycle}</Text>
                <Text style={s.cycleCount}>{own}/{sets.length}</Text>
              </View>
              {sets.map(exp=>(
                <View key={exp.code} style={s.setRow}>
                  <Text style={s.setIcon}>{TYPE_ICON[exp.type]??'📄'}</Text>
                  <View style={s.setInfo}>
                    <Text style={[s.setName,!ownedSets[exp.code]&&s.setNameOff]}>{exp.name}</Text>
                    <Text style={s.setSub}>{exp.type} · {exp.totalCards} cards</Text>
                  </View>
                  {exp.comingSoon ? (
                    <View style={s.comingSoonBadge}>
                      <Text style={s.comingSoonTxt}>Soon™</Text>
                    </View>
                  ) : (
                    <Switch value={!!ownedSets[exp.code]}
                      onValueChange={v=>setOwnedSets(prev=>({...prev,[exp.code]:v}))}
                      trackColor={{false:Colors.border,true:Colors.success}}
                      thumbColor={ownedSets[exp.code]?Colors.text:Colors.textMuted}/>
                  )}
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},container:{padding:Spacing.lg,gap:12,paddingBottom:40},
  title:{fontSize:22,fontWeight:'700',color:Colors.text},
  infoCard:{borderWidth:1,borderColor:Colors.info+'44',borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:'#0d1220',gap:4},
  infoTitle:{fontSize:13,fontWeight:'600',color:Colors.info},infoTxt:{fontSize:12,color:Colors.textMuted,lineHeight:18},
  statsRow:{flexDirection:'row',gap:10},
  statCard:{flex:1,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:Colors.surface,alignItems:'center',gap:4},
  statNum:{fontSize:26,fontWeight:'700',color:Colors.text},statLabel:{fontSize:12,color:Colors.textMuted},
  cycleHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:8,marginBottom:4},
  cycleTitle:{fontSize:13,fontWeight:'700',color:Colors.text},cycleCount:{fontSize:12,color:Colors.textMuted},
  setRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:Colors.surface,marginBottom:5,gap:8},
  setIcon:{fontSize:18},setInfo:{flex:1},
  setName:{fontSize:13,color:Colors.text,fontWeight:'500'},setNameOff:{color:Colors.textMuted},
  setSub:{fontSize:11,color:Colors.textMuted,marginTop:1},
  comingSoonBadge:{borderWidth:1,borderColor:Colors.info+'66',borderRadius:4,paddingHorizontal:6,paddingVertical:3,backgroundColor:'#0d1220'},
  comingSoonTxt:{fontSize:10,color:Colors.info,fontWeight:'600'},
});

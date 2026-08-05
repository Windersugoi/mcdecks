import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { SET_CATALOG } from '@/data/cards';
import { DarkColors, LightColors, Radius, Spacing } from '@/styles/theme';

const CYCLE_GROUPS: { label: string; codes: string[] }[] = [
  { label: 'Core Set — Cycle 1',                codes: ['Core','GG','A:CA','C:MM','TWC','A:T','A:BW','A:DS','A:H'] },
  { label: 'The Rise of Red Skull — Cycle 2',   codes: ['A:TRoRS','OaFK','A:A','A:W','A:Q','A:SW'] },
  { label: "Galaxy's Most Wanted — Cycle 3",    codes: ['G:GMW','G:SL','G:G','G:D','G:V'] },
  { label: "The Mad Titan's Shadow — Cycle 4",  codes: ['G:TMTS','G:N','A:WM','TH','A:V','V','TT'] },
  { label: 'Sinister Motives — Cycle 5',        codes: ['W:SM','C:N','C:I','W:SH','W:S'] },
  { label: 'Mutant Genesis — Cycle 6',          codes: ['X:MG','X:C','X:P','X:MM','X:W','X:S','X:G','X:R'] },
  { label: 'NeXt Evolution — Cycle 7',          codes: ['X:NE','X:Ps','X:A','X:X','X:D'] },
  { label: 'The Age of Apocalypse — Cycle 8',   codes: ['X:AoA','X:I','X:J','X:N','X:M'] },
  { label: 'Agents of S.H.I.E.L.D. — Cycle 9', codes: ['S:AoS','BP','W:Si','S:F','S:WS','TT2'] },
  { label: 'Civil War — Cycle 10',              codes: ['CW','SS','A:WMn','A:He'] },
  { label: 'Fear No Evil — Cycle 11',           codes: ['D:FNE','D:JJ','D:LC'] },
  { label: 'Cycle 11 (Coming Soon)',             codes: ['D:SH','D:EL','D:IF'] },
  { label: 'Modules',                           codes: ['R'] },
];

const TYPE_ICON: Record<string,string> = {
  box:'📦', hero:'🦸', scenario:'🦹', campaign:'📖', module:'🔧',
};

export default function CuentaScreen() {
  const { ownedSets, setOwnedSets, lightMode, setLightMode } = useApp();
  const C = lightMode ? LightColors : DarkColors;
  const s = useMemo(() => getStyles(C), [C]);

  const setByCode: Record<string, typeof SET_CATALOG[0]> = {};
  for (const x of SET_CATALOG) setByCode[x.code] = x;

  const totalOwned = SET_CATALOG.filter(x => ownedSets[x.code]).length;
  const totalCards = SET_CATALOG.filter(x => ownedSets[x.code]).reduce((a,x) => a + x.totalCards, 0);

  const availableSets = SET_CATALOG.filter(x => !x.comingSoon);
  const allOwned = availableSets.length > 0 && availableSets.every(x => ownedSets[x.code]);
  const someOwned = availableSets.some(x => ownedSets[x.code]) && !allOwned;

  function toggleAll() {
    const val = !allOwned;
    setOwnedSets(prev => {
      const next = { ...prev };
      for (const x of availableSets) next[x.code] = val;
      return next;
    });
  }

  function getGroupSets(g: typeof CYCLE_GROUPS[0]) {
    return g.codes.map(c => setByCode[c]).filter(Boolean).filter(x => !x.comingSoon);
  }
  function isComplete(g: typeof CYCLE_GROUPS[0]) {
    const sets = getGroupSets(g);
    return sets.length > 0 && sets.every(x => ownedSets[x.code]);
  }
  function isPartial(g: typeof CYCLE_GROUPS[0]) {
    const sets = getGroupSets(g);
    return sets.some(x => ownedSets[x.code]) && !sets.every(x => ownedSets[x.code]);
  }
  function toggleGroup(g: typeof CYCLE_GROUPS[0], val: boolean) {
    setOwnedSets(prev => {
      const next = { ...prev };
      for (const x of getGroupSets(g)) next[x.code] = val;
      return next;
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container}>

        {/* Header */}
        <View style={s.headerRow}>
          <Text style={s.title}>Mi Colección</Text>
          <View style={s.modeToggle}>
            <Text style={s.modeLbl}>{lightMode ? '☀️' : '🌙'}</Text>
            <Switch value={lightMode} onValueChange={setLightMode}
              trackColor={{ false: C.border, true: '#f0c040' }}
              thumbColor={C.text} />
          </View>
        </View>

        {/* Marcar todo */}
        <Pressable style={s.markAllRow} onPress={toggleAll}>
          <View style={[s.check, allOwned && s.checkDone, someOwned && s.checkPartial]}>
            {allOwned  && <Text style={s.checkMark}>✓</Text>}
            {someOwned && !allOwned && <Text style={s.checkDash}>–</Text>}
          </View>
          <Text style={s.markAllLbl}>
            {allOwned ? 'Desmarcar todo' : 'Marcar todo'}
          </Text>
          <Text style={s.markAllSub}>{totalOwned}/{availableSets.length} sets</Text>
        </Pressable>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalOwned}</Text>
            <Text style={s.statLbl}>Sets</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalCards.toLocaleString()}</Text>
            <Text style={s.statLbl}>Cartas</Text>
          </View>
        </View>

        {/* Cycles */}
        {CYCLE_GROUPS.map(group => {
          const allSets = group.codes.map(c => setByCode[c]).filter(Boolean);
          if (allSets.length === 0) return null;
          const complete = isComplete(group);
          const partial = isPartial(group);
          const available = getGroupSets(group);
          const ownedCount = available.filter(x => ownedSets[x.code]).length;
          const isSoon = group.label.includes('Coming Soon');

          return (
            <View key={group.label} style={s.groupCard}>
              <Pressable style={s.groupHeader}
                onPress={() => !isSoon && toggleGroup(group, !complete)}
                disabled={isSoon}>
                <View style={[s.check, complete && s.checkDone, partial && !complete && s.checkPartial]}>
                  {complete && <Text style={s.checkMark}>✓</Text>}
                  {partial && !complete && <Text style={s.checkDash}>–</Text>}
                </View>
                <Text style={[s.groupLbl, complete && { color: C.success }, isSoon && { color: C.info }]}>
                  {group.label}
                </Text>
                {!isSoon
                  ? <Text style={s.groupCount}>{ownedCount}/{available.length}</Text>
                  : <View style={s.soonBadge}><Text style={s.soonTxt}>Soon™</Text></View>
                }
              </Pressable>

              {allSets.map((exp, idx) => (
                <View key={exp.code} style={[s.setRow, idx === 0 && s.setRowBox]}>
                  <Text style={s.setIcon}>{TYPE_ICON[exp.type] ?? '📄'}</Text>
                  <View style={s.setInfo}>
                    <Text style={[s.setName, !ownedSets[exp.code] && s.setNameOff,
                      idx === 0 && s.setNameBold]}>{exp.name}</Text>
                    <Text style={s.setSub}>{exp.type} · {exp.totalCards} cartas</Text>
                  </View>
                  {exp.comingSoon
                    ? <View style={s.soonBadge}><Text style={s.soonTxt}>Soon™</Text></View>
                    : <Switch value={!!ownedSets[exp.code]}
                        onValueChange={v => setOwnedSets(prev => ({ ...prev, [exp.code]: v }))}
                        trackColor={{ false: C.border, true: C.success }}
                        thumbColor={ownedSets[exp.code] ? C.text : C.textMuted} />
                  }
                </View>
              ))}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: typeof DarkColors) {
  return StyleSheet.create({
    safe:        { flex:1, backgroundColor:C.bg },
    container:   { padding:Spacing.lg, gap:10, paddingBottom:40 },
    headerRow:   { flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
    title:       { fontSize:22, fontWeight:'700', color:C.text },
    modeToggle:  { flexDirection:'row', alignItems:'center', gap:6 },
    modeLbl:     { fontSize:14 },
    markAllRow:  { flexDirection:'row', alignItems:'center', gap:10,
                   borderWidth:1, borderColor:C.border, borderRadius:Radius.lg,
                   backgroundColor:C.surface2, padding:Spacing.md },
    markAllLbl:  { flex:1, fontSize:14, fontWeight:'700', color:C.text },
    markAllSub:  { fontSize:12, color:C.textMuted },
    statsRow:    { flexDirection:'row', gap:10 },
    statCard:    { flex:1, borderWidth:1, borderColor:C.border, borderRadius:Radius.lg,
                   padding:Spacing.md, backgroundColor:C.surface, alignItems:'center', gap:4 },
    statNum:     { fontSize:26, fontWeight:'700', color:C.text },
    statLbl:     { fontSize:12, color:C.textMuted },
    groupCard:   { borderWidth:1, borderColor:C.border, borderRadius:Radius.lg,
                   backgroundColor:C.surface, overflow:'hidden' },
    groupHeader: { flexDirection:'row', alignItems:'center', padding:Spacing.md,
                   gap:10, backgroundColor:C.surface2 },
    check:       { width:22, height:22, borderRadius:6, borderWidth:2,
                   borderColor:C.borderStrong, justifyContent:'center', alignItems:'center', flexShrink:0 },
    checkDone:   { backgroundColor:C.success, borderColor:C.success },
    checkPartial:{ borderColor:C.warning },
    checkMark:   { color:'#0f0f0d', fontSize:13, fontWeight:'700' },
    checkDash:   { color:C.warning, fontSize:14, fontWeight:'700' },
    groupLbl:    { flex:1, fontSize:13, fontWeight:'700', color:C.text },
    groupCount:  { fontSize:12, color:C.textMuted, flexShrink:0 },
    setRow:      { flexDirection:'row', alignItems:'center', padding:Spacing.sm,
                   paddingHorizontal:Spacing.md, gap:8, borderTopWidth:1, borderTopColor:C.border },
    setRowBox:   { backgroundColor:C.surface2 },
    setIcon:     { fontSize:16 },
    setInfo:     { flex:1 },
    setName:     { fontSize:13, color:C.text },
    setNameOff:  { color:C.textMuted },
    setNameBold: { fontWeight:'600' },
    setSub:      { fontSize:11, color:C.textMuted, marginTop:1 },
    soonBadge:   { borderWidth:1, borderColor:C.info+'66', borderRadius:4,
                   paddingHorizontal:6, paddingVertical:3, backgroundColor:C.surface2 },
    soonTxt:     { fontSize:10, color:C.info, fontWeight:'600' },
  });
}

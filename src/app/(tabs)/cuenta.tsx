import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { SET_CATALOG } from '@/data/cards';
import { Colors, Radius, Spacing } from '@/styles/theme';

// Cada grupo = caja del ciclo (primera) + hero packs del ciclo
// La caja es la primera entrada y va destacada
const CYCLE_GROUPS: { label: string; codes: string[] }[] = [
  { label: 'Core Set — Cycle 1',                   codes: ['Core','GG','A:CA','C:MM','TWC','A:T','A:BW','A:DS','A:H'] },
  { label: 'The Rise of Red Skull — Cycle 2',       codes: ['A:TRoRS','OaFK','A:A','A:W','A:Q','A:SW'] },
  { label: "Galaxy's Most Wanted — Cycle 3",        codes: ['G:GMW','G:SL','G:G','G:D','G:V'] },
  { label: "The Mad Titan's Shadow — Cycle 4",      codes: ['G:TMTS','G:N','A:WM','TH','A:V','V','TT'] },
  { label: 'Sinister Motives — Cycle 5',            codes: ['W:SM','C:N','C:I','W:SH','W:S'] },
  { label: 'Mutant Genesis — Cycle 6',              codes: ['X:MG','X:C','X:P','X:MM','X:W','X:S','X:G','X:R'] },
  { label: 'NeXt Evolution — Cycle 7',              codes: ['X:NE','X:Ps','X:A','X:X','X:D'] },
  { label: 'The Age of Apocalypse — Cycle 8',       codes: ['X:AoA','X:I','X:J','X:N','X:M'] },
  { label: 'Agents of S.H.I.E.L.D. — Cycle 9',     codes: ['S:AoS','BP','W:Si','S:F','S:WS','TT2'] },
  { label: 'Civil War — Cycle 10',                  codes: ['CW','SS','A:WMn','A:He'] },
  { label: 'Fear No Evil — Cycle 11',              codes: ['D:FNE','D:JJ','D:LC'] },
  { label: 'Cycle 11 (Coming Soon)',                 codes: ['D:SH','D:EL','D:IF'] },
  { label: 'Modules',                               codes: ['R'] },
];

const TYPE_ICON: Record<string,string> = {
  box:'📦', hero:'🦸', scenario:'🦹', campaign:'📖', module:'🔧'
};

export default function CuentaScreen() {
  const { ownedSets, setOwnedSets, lightMode, setLightMode } = useApp();

  // Índice de sets por código para acceso rápido
  const setByCode: Record<string, typeof SET_CATALOG[0]> = {};
  for (const s of SET_CATALOG) setByCode[s.code] = s;

  const totalOwned = SET_CATALOG.filter(s => ownedSets[s.code]).length;
  const totalCards = SET_CATALOG.filter(s => ownedSets[s.code]).reduce((a,s) => a + s.totalCards, 0);

  function getGroupSets(group: typeof CYCLE_GROUPS[0]) {
    return group.codes
      .map(code => setByCode[code])
      .filter(Boolean)
      .filter(s => !s.comingSoon);
  }

  function isGroupComplete(group: typeof CYCLE_GROUPS[0]) {
    const sets = getGroupSets(group);
    return sets.length > 0 && sets.every(s => ownedSets[s.code]);
  }

  function isGroupPartial(group: typeof CYCLE_GROUPS[0]) {
    const sets = getGroupSets(group);
    return sets.some(s => ownedSets[s.code]) && !sets.every(s => ownedSets[s.code]);
  }

  function toggleGroup(group: typeof CYCLE_GROUPS[0], value: boolean) {
    const sets = getGroupSets(group);
    setOwnedSets(prev => {
      const next = { ...prev };
      for (const s of sets) next[s.code] = value;
      return next;
    });
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
          <Text style={s.title}>Mi Colección</Text>
          <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
            <Text style={{ fontSize:11, color:Colors.textMuted }}>{lightMode ? 'Claro' : 'Oscuro'}</Text>
            <Switch
              value={lightMode}
              onValueChange={setLightMode}
              trackColor={{ false: Colors.border, true: Colors.warning }}
              thumbColor={Colors.text}
            />
          </View>
        </View>

        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalOwned}</Text>
            <Text style={s.statLabel}>Sets</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statNum}>{totalCards.toLocaleString()}</Text>
            <Text style={s.statLabel}>Cartas</Text>
          </View>
        </View>

        {CYCLE_GROUPS.map(group => {
          const allSets = group.codes.map(code => setByCode[code]).filter(Boolean);
          if (allSets.length === 0) return null;
          const complete = isGroupComplete(group);
          const partial = isGroupPartial(group);
          const ownedCount = getGroupSets(group).filter(s => ownedSets[s.code]).length;
          const totalCount = getGroupSets(group).length;
          const isComingSoon = group.label.includes('Coming Soon');

          return (
            <View key={group.label} style={s.groupCard}>
              {/* Header del ciclo con checkbox */}
              <Pressable
                style={s.groupHeader}
                onPress={() => !isComingSoon && toggleGroup(group, !complete)}
                disabled={isComingSoon}
              >
                <View style={[
                  s.groupCheck,
                  complete && s.groupCheckDone,
                  partial && !complete && s.groupCheckPartial
                ]}>
                  {complete && <Text style={s.checkMark}>✓</Text>}
                  {partial && !complete && <Text style={s.checkMarkP}>–</Text>}
                </View>
                <Text style={[
                  s.groupLabel,
                  complete && { color: Colors.success },
                  isComingSoon && { color: Colors.info }
                ]}>
                  {group.label}
                </Text>
                {!isComingSoon && (
                  <Text style={s.groupCount}>{ownedCount}/{totalCount}</Text>
                )}
                {isComingSoon && (
                  <View style={s.soonBadge}><Text style={s.soonTxt}>Soon™</Text></View>
                )}
              </Pressable>

              {/* Sets del ciclo */}
              {allSets.map((exp, idx) => {
                const isBox = idx === 0; // Primera entrada = la caja del ciclo
                return (
                  <View key={exp.code}
                    style={[s.setRow, isBox && s.setRowBox]}>
                    <Text style={s.setIcon}>{TYPE_ICON[exp.type] ?? '📄'}</Text>
                    <View style={s.setInfo}>
                      <Text style={[
                        s.setName,
                        !ownedSets[exp.code] && s.setNameOff,
                        isBox && s.setNameBox
                      ]}>
                        {exp.name}
                      </Text>
                      <Text style={s.setSub}>{exp.type} · {exp.totalCards} cartas</Text>
                    </View>
                    {exp.comingSoon ? (
                      <View style={s.soonBadge}><Text style={s.soonTxt}>Soon™</Text></View>
                    ) : (
                      <Switch
                        value={!!ownedSets[exp.code]}
                        onValueChange={v => setOwnedSets(prev => ({ ...prev, [exp.code]: v }))}
                        trackColor={{ false: Colors.border, true: Colors.success }}
                        thumbColor={ownedSets[exp.code] ? Colors.text : Colors.textMuted}
                      />
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: typeof import("@/styles/theme").DarkColors) {
  return StyleSheet.create({
  safe: { flex:1, backgroundColor:C.bg },
  container: { padding:Spacing.lg, gap:10, paddingBottom:40 },
  title: { fontSize:22, fontWeight:'700', color:C.text },
  statsRow: { flexDirection:'row', gap:10 },
  statCard: { flex:1, borderWidth:1, borderColor:C.border, borderRadius:Radius.lg, padding:Spacing.md, backgroundColor:C.surface, alignItems:'center', gap:4 },
  statNum: { fontSize:26, fontWeight:'700', color:C.text },
  statLabel: { fontSize:12, color:C.textMuted },
  groupCard: { borderWidth:1, borderColor:C.border, borderRadius:Radius.lg, backgroundColor:C.surface, overflow:'hidden' },
  groupHeader: { flexDirection:'row', alignItems:'center', padding:Spacing.md, gap:10, backgroundColor:C.surface2 },
  groupCheck: { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:C.borderStrong, justifyContent:'center', alignItems:'center', flexShrink:0 },
  groupCheckDone: { backgroundColor:C.success, borderColor:C.success },
  groupCheckPartial: { borderColor:C.warning },
  checkMark: { color:'#0f0f0d', fontSize:13, fontWeight:'700' },
  checkMarkP: { color:C.warning, fontSize:14, fontWeight:'700' },
  groupLabel: { flex:1, fontSize:13, fontWeight:'700', color:C.text },
  groupCount: { fontSize:12, color:C.textMuted, flexShrink:0 },
  setRow: { flexDirection:'row', alignItems:'center', padding:Spacing.sm, paddingHorizontal:Spacing.md, gap:8, borderTopWidth:1, borderTopColor:C.border },
  setRowBox: { backgroundColor:'#141412' },
  setIcon: { fontSize:16 },
  setInfo: { flex:1 },
  setName: { fontSize:13, color:C.text },
  setNameOff: { color:C.textMuted },
  setNameBox: { fontWeight:'600' },
  setSub: { fontSize:11, color:C.textMuted, marginTop:1 },
  soonBadge: { borderWidth:1, borderColor:C.info+'66', borderRadius:4, paddingHorizontal:6, paddingVertical:3, backgroundColor:'#0d1220' },
  soonTxt: { fontSize:10, color:C.info, fontWeight:'600' },
});
}

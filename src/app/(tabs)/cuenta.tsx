import React from 'react';
import { View, Text, ScrollView, StyleSheet, Switch, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { SET_CATALOG } from '@/data/cards';
import { Colors, Radius, Spacing } from '@/styles/theme';

// Estructura de ciclos según Hall of Heroes
const CYCLES_ORDER = [
  'Core Set',
  'Cycle 1', 'Rise of Red Skull',
  'Cycle 2', "Galaxy's Most Wanted",
  'Cycle 3', "Mad Titan's Shadow",
  'Cycle 4', 'Sinister Motives',
  'Cycle 5', 'Mutant Genesis',
  'Cycle 6', 'NeXt Evolution',
  'Cycle 7', 'Age of Apocalypse',
  'Cycle 8', 'Agents of S.H.I.E.L.D.',
  'Cycle 9', 'Civil War',
  'Cycle 10', 'Fear No Evil',
  'Cycle 11', 'Modules',
];

// Grupos visuales para el check de "ciclo completo"
// Campaign boxes y sus ciclos de hero packs van agrupados
const CYCLE_GROUPS = [
  { label: 'Core Set',               cycles: ['Core Set'] },
  { label: 'Cycle 1',                cycles: ['Cycle 1', 'Rise of Red Skull'] },
  { label: 'Cycle 2 — Galaxy',       cycles: ['Cycle 2', "Galaxy's Most Wanted"] },
  { label: 'Cycle 3 — Titan',        cycles: ['Cycle 3', "Mad Titan's Shadow"] },
  { label: 'Cycle 4 — Sinister',     cycles: ['Cycle 4', 'Sinister Motives'] },
  { label: 'Cycle 5 — Mutant',       cycles: ['Cycle 5', 'Mutant Genesis'] },
  { label: 'Cycle 6 — NeXt',         cycles: ['Cycle 6', 'NeXt Evolution'] },
  { label: 'Cycle 7 — Apocalypse',   cycles: ['Cycle 7', 'Age of Apocalypse'] },
  { label: 'Cycle 8 — SHIELD',       cycles: ['Cycle 8', 'Agents of S.H.I.E.L.D.'] },
  { label: 'Cycle 9 — Civil War',    cycles: ['Cycle 9', 'Civil War'] },
  { label: 'Cycle 10 — Fear No Evil',cycles: ['Cycle 10', 'Fear No Evil', 'Cycle 11'] },
  { label: 'Modules',                cycles: ['Modules'] },
];

const TYPE_ICON: Record<string,string> = {
  box:'📦', hero:'🦸', scenario:'🦹', campaign:'📖', module:'🔧'
};

export default function CuentaScreen() {
  const { ownedSets, setOwnedSets } = useApp();

  const byCycle: Record<string, typeof SET_CATALOG> = {};
  for (const s of SET_CATALOG) {
    if (!byCycle[s.cycle]) byCycle[s.cycle] = [];
    byCycle[s.cycle].push(s);
  }

  const totalOwned = SET_CATALOG.filter(s => ownedSets[s.code]).length;
  const totalCards = SET_CATALOG.filter(s => ownedSets[s.code]).reduce((a,s) => a + s.totalCards, 0);

  function toggleGroup(group: typeof CYCLE_GROUPS[0], value: boolean) {
    const codes = CYCLE_GROUPS
      .find(g => g.label === group.label)
      ?.cycles.flatMap(cy => (byCycle[cy] ?? []).map(s => s.code)) ?? [];
    setOwnedSets(prev => {
      const next = { ...prev };
      for (const code of codes) {
        if (!SET_CATALOG.find(s => s.code === code)?.comingSoon) {
          next[code] = value;
        }
      }
      return next;
    });
  }

  function isGroupComplete(group: typeof CYCLE_GROUPS[0]): boolean {
    const sets = group.cycles.flatMap(cy => byCycle[cy] ?? []).filter(s => !s.comingSoon);
    return sets.length > 0 && sets.every(s => ownedSets[s.code]);
  }

  function isGroupPartial(group: typeof CYCLE_GROUPS[0]): boolean {
    const sets = group.cycles.flatMap(cy => byCycle[cy] ?? []).filter(s => !s.comingSoon);
    return sets.some(s => ownedSets[s.code]) && !sets.every(s => ownedSets[s.code]);
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container}>
        <Text style={s.title}>Mi Colección</Text>
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
          const sets = group.cycles.flatMap(cy => byCycle[cy] ?? []);
          if (sets.length === 0) return null;
          const complete = isGroupComplete(group);
          const partial = isGroupPartial(group);

          return (
            <View key={group.label} style={s.groupCard}>
              {/* Cabecera del grupo con checkbox de ciclo completo */}
              <Pressable style={s.groupHeader} onPress={() => toggleGroup(group, !complete)}>
                <View style={[s.groupCheck, complete && s.groupCheckDone, partial && s.groupCheckPartial]}>
                  {complete && <Text style={s.checkMark}>✓</Text>}
                  {partial && !complete && <Text style={s.checkMarkPartial}>–</Text>}
                </View>
                <Text style={[s.groupLabel, complete && { color: Colors.success }]}>
                  {group.label}
                </Text>
                <Text style={s.groupCount}>
                  {sets.filter(x => ownedSets[x.code]).length}/{sets.filter(x => !x.comingSoon).length}
                </Text>
              </Pressable>

              {/* Sets individuales agrupados por ciclo */}
              {group.cycles.map(cy => {
                const cycleSets = byCycle[cy] ?? [];
                if (cycleSets.length === 0) return null;
                return (
                  <View key={cy}>
                    {group.cycles.length > 1 && (
                      <Text style={s.cycleSubLabel}>{cy}</Text>
                    )}
                    {cycleSets.map(exp => (
                      <View key={exp.code} style={s.setRow}>
                        <Text style={s.setIcon}>{TYPE_ICON[exp.type] ?? '📄'}</Text>
                        <View style={s.setInfo}>
                          <Text style={[s.setName, !ownedSets[exp.code] && s.setNameOff]}>
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
                    ))}
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

const s = StyleSheet.create({
  safe: { flex:1, backgroundColor:Colors.bg },
  container: { padding:Spacing.lg, gap:10, paddingBottom:40 },
  title: { fontSize:22, fontWeight:'700', color:Colors.text },
  statsRow: { flexDirection:'row', gap:10 },
  statCard: { flex:1, borderWidth:1, borderColor:Colors.border, borderRadius:Radius.lg, padding:Spacing.md, backgroundColor:Colors.surface, alignItems:'center', gap:4 },
  statNum: { fontSize:26, fontWeight:'700', color:Colors.text },
  statLabel: { fontSize:12, color:Colors.textMuted },

  groupCard: { borderWidth:1, borderColor:Colors.border, borderRadius:Radius.lg, backgroundColor:Colors.surface, overflow:'hidden' },
  groupHeader: { flexDirection:'row', alignItems:'center', padding:Spacing.md, gap:10, backgroundColor:Colors.surface2 },
  groupCheck: { width:22, height:22, borderRadius:6, borderWidth:2, borderColor:Colors.borderStrong, justifyContent:'center', alignItems:'center' },
  groupCheckDone: { backgroundColor:Colors.success, borderColor:Colors.success },
  groupCheckPartial: { borderColor:Colors.warning },
  checkMark: { color:'#0f0f0d', fontSize:13, fontWeight:'700' },
  checkMarkPartial: { color:Colors.warning, fontSize:14, fontWeight:'700' },
  groupLabel: { flex:1, fontSize:14, fontWeight:'700', color:Colors.text },
  groupCount: { fontSize:12, color:Colors.textMuted },

  cycleSubLabel: { fontSize:11, color:Colors.textMuted, fontWeight:'600', paddingHorizontal:Spacing.md, paddingTop:Spacing.sm, textTransform:'uppercase', letterSpacing:0.5 },

  setRow: { flexDirection:'row', alignItems:'center', padding:Spacing.sm, paddingHorizontal:Spacing.md, gap:8, borderTopWidth:1, borderTopColor:Colors.border },
  setIcon: { fontSize:16 },
  setInfo: { flex:1 },
  setName: { fontSize:13, color:Colors.text, fontWeight:'500' },
  setNameOff: { color:Colors.textMuted },
  setSub: { fontSize:11, color:Colors.textMuted, marginTop:1 },
  soonBadge: { borderWidth:1, borderColor:Colors.info+'66', borderRadius:4, paddingHorizontal:6, paddingVertical:3, backgroundColor:'#0d1220' },
  soonTxt: { fontSize:10, color:Colors.info, fontWeight:'600' },
});

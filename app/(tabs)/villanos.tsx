import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { ActiveDeckBanner } from '@/components/ActiveDeckBanner';
import { deckTitleColor } from '@/utils/deckUtils';
import { VILLAIN_SETS_BY_CYCLE, VILLAIN_TO_SET } from '@/data/constants';
import { SET_CATALOG } from '@/data/cards';
import { Colors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';

// ── Imágenes locales (require estático — Metro las analiza en build time) ──────
// Añade aquí cualquier imagen JPG que tengas en assets/villanos/
// El nombre debe coincidir EXACTAMENTE con el nombre del villano en la app
const LOCAL: Record<string, any> = {
  'Batroc':       require('../../../assets/villanos/Batroc.jpg'),
  'M.O.D.O.K.':  require('../../../assets/villanos/MODOK.jpg'),
  'She-Hulk (L)': require('../../../assets/villanos/She-Hulk_L.jpg'),
  'Vision (L)':   require('../../../assets/villanos/Vision_L.jpg'),
};

// ── URLs de marvelcdb para villanos de encuentro ─────────────────────────────
// Formato: pack numérico 5 dígitos (ej. "01094" = pack 01, carta 094)
// Si no funciona el formato numérico, prueba el de texto (ej. "core094")
const MCDB = 'https://marvelcdb.com/bundles/cards/';
const VILLAIN_URLS: Record<string, string> = {
  // Core Set (pack 01)
  'Rhino':             MCDB + '01094.png',
  'Klaw':              MCDB + '01113.png',
  'Ultron':            MCDB + '01134.png',
  // Green Goblin (pack 02)
  'Green Goblin':      MCDB + '02001b.png',
  'Norman Osborn':     MCDB + '02001a.png',
  // Wrecking Crew (pack 07)
  'The Wrecking Crew': MCDB + '07002.png',
  // Rise of Red Skull (pack 04)
  'Crossbones':        MCDB + '04058.png',
  'Absorbing Man':     MCDB + '04076.png',
  'Taskmaster':        MCDB + '04093.png',
  'Zola':              MCDB + '04109.png',
  'Red Skull':         MCDB + '04125.png',
  // Kang (pack 11)
  'Kang':              MCDB + '11001.png',
  // Galaxy's Most Wanted (pack 16)
  'Drang':             MCDB + '16058.png',
  'The Collector':     MCDB + '16070.png',
  'Nebula (V)':        MCDB + '16088.png',
  'Ronan the Accuser': MCDB + '16103.png',
  // Mad Titan's Shadow (pack 21)
  'Ebony Maw':         MCDB + '21071.png',
  'Proxima Midnight':  MCDB + '21092.png',
  'Corvus Glaive':     MCDB + '21095.png',
  'Thanos':            MCDB + '21111.png',
  // The Hood (pack 24)
  'The Hood':          MCDB + '24001.png',
  // Sinister Motives (pack 27)
  'Sandman':           MCDB + '27061.png',
  'Venom (V)':         MCDB + '27073.png',
  'Mysterio':          MCDB + '27084.png',
  'Doctor Octopus':    MCDB + '27094.png',
  'Electro':           MCDB + '27095.png',
  'Hobgoblin':         MCDB + '27096.png',
  'Scorpion':          MCDB + '27098.png',
  'Vulture':           MCDB + '27099.png',
  'Venom Goblin':      MCDB + '27113.png',
  // Mutant Genesis (pack 32)
  'Sabretooth':        MCDB + '32060.png',
  'Sentinel':          MCDB + '32084.png',
  'Master Mold':       MCDB + '32109.png',
  'Magneto (V)':       MCDB + '32138.png',
  // Mojo (pack 39)
  'Mojo':              MCDB + '39022.png',
  // NeXt Evolution (pack 40)
  'Juggernaut':        MCDB + '40118.png',
  'Mister Sinister':   MCDB + '40136.png',
  'Stryfe':            MCDB + '40163.png',
  // Age of Apocalypse (pack 45)
  'Unus':              MCDB + '45059.png',
  'Four Horsemen':     MCDB + '45085.png',
  'Dark Beast':        MCDB + '45118.png',
  'Apocalypse':        MCDB + '45101a.png',
  // Agents of SHIELD (pack 50)
  'Black Widow (V)':   MCDB + '50064.png',
  // Civil War (pack 56)
  'Iron Man (L)':      MCDB + '56059.png',
  'Captain Marvel (L)':MCDB + '56092.png',
  'Captain America (L)':MCDB + '56137.png',
  'Spider-Woman (L)':  MCDB + '56168.png',
  // Synthezoid Smackdown (pack 57)
};

// ── Componente de imagen de villano ─────────────────────────────────────────
function VillainImage({ name, size = 'small' }: { name: string; size?: 'small' | 'large' }) {
  const C = useColors();
  const [error, setError] = useState(false);
  const local = LOCAL[name];
  const remoteUrl = VILLAIN_URLS[name];
  // Formato carta real (retrato ~0.72), no un banner horizontal que recorta la imagen
  const dims = size === 'large' ? { width: '100%' as const, height: 220 } : { width: 104, height: 145 };

  // 1. Imagen local (máxima prioridad)
  if (local) {
    return (
      <View style={[dims, { backgroundColor: C.bg, overflow: 'hidden' }]}>
        <Image source={local} style={{ width: '100%', height: '100%' }}
          resizeMode={size === 'large' ? 'contain' : 'cover'} />
      </View>
    );
  }

  // 2. URL remota (marvelcdb)
  if (remoteUrl && !error) {
    return (
      <View style={[dims, { backgroundColor: C.bg, overflow: 'hidden' }]}>
        <Image source={{ uri: remoteUrl }}
          style={{ width: '100%', height: '100%' }}
          resizeMode={size === 'large' ? 'contain' : 'cover'}
          onError={() => setError(true)} />
      </View>
    );
  }

  // 3. Placeholder con nombre
  return (
    <View style={[dims, { backgroundColor: C.surface2, justifyContent: 'center', alignItems: 'center' }]}>
      <Text style={{ fontSize: size === 'large' ? 16 : 10, color: C.textMuted, textAlign: 'center', padding: 4 }}>
        {name}
      </Text>
    </View>
  );
}

export default function VillanosScreen() {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const { decks, setDecks, activeDeck, ownedSets } = useApp();
  const [open, setOpen] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  function isOwned(v: string) {
    if (showAll) return true;
    const code = VILLAIN_TO_SET[v];
    return !code || !!ownedSets[code];
  }
  function getSetName(v: string) {
    const code = VILLAIN_TO_SET[v];
    return code ? (SET_CATALOG.find(s => s.code === code)?.name ?? code) : '';
  }
  function toggleDefeated(v: string) {
    if (!activeDeck) return;
    setDecks(prev => prev.map(d => {
      if (d.id !== activeDeck.id) return d;
      const cur = d.villains?.[v] ?? { defeated: false, modular: [] };
      return { ...d, villains: { ...d.villains, [v]: { ...cur, defeated: !cur.defeated } } };
    }));
  }

  // ── Vista detalle ────────────────────────────────────────────────────────
  if (open) {
    const vData = activeDeck?.villains?.[open] ?? { defeated: false, modular: [] };
    const defeatedBy = decks.filter(d => d.villains?.[open]?.defeated);
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <ScrollView contentContainerStyle={s.container}>
          <Pressable onPress={() => setOpen(null)} style={s.backBtn}>
            <Text style={s.backTxt}>← Villains</Text>
          </Pressable>
          <View style={[s.detailImg, vData.defeated && { borderColor: C.success + '88' }]}>
            <VillainImage name={open} size="large" />
            {vData.defeated && (
              <View style={s.defeatedOverlay}>
                <Text style={s.defeatedTxt}>✓ DEFEATED</Text>
              </View>
            )}
          </View>
          <Text style={s.villainTitle}>{open}</Text>
          {!isOwned(open) && (
            <View style={s.missingBanner}>
              <Text style={s.missingTxt}>⚠ Missing: {getSetName(open)}</Text>
            </View>
          )}
          <ActiveDeckBanner activeDeck={activeDeck} />
          {activeDeck && (
            <View style={[s.card, { borderColor: deckTitleColor(activeDeck) + '55' }]}>
              <Pressable style={s.checkRow} onPress={() => toggleDefeated(open)}>
                <View style={[s.cb, vData.defeated && s.cbDone]}>
                  {vData.defeated && <Text style={s.check}>✓</Text>}
                </View>
                <Text style={[s.checkLabel, vData.defeated && { color: C.success }]}>
                  {vData.defeated ? '✓ Defeated with this deck' : 'Mark as defeated'}
                </Text>
              </Pressable>
            </View>
          )}
          <Text style={s.sectionTitle}>All decks history</Text>
          {defeatedBy.length === 0
            ? <Text style={s.empty}>Not defeated with any deck yet.</Text>
            : defeatedBy.map(d => (
                <View key={d.id} style={s.histRow}>
                  <Text style={[s.histDeck, { color: deckTitleColor(d) }]}>{d.name}</Text>
                  <Text style={s.histHero}>{d.hero ?? ''}</Text>
                </View>
              ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Vista grid ───────────────────────────────────────────────────────────
  const filteredSets = Object.entries(VILLAIN_SETS_BY_CYCLE)
    .map(([cycle, villains]) => ({ cycle, villains: villains.filter(v => isOwned(v)) }))
    .filter(({ villains }) => villains.length > 0);

  // Barra de progreso: villanos de tu colección vs derrotados con mazo activo
  const ownedVillains = filteredSets.flatMap(({ villains }) => villains);
  const defeatedCount = activeDeck
    ? ownedVillains.filter(v => activeDeck.villains?.[v]?.defeated).length
    : 0;
  const totalOwned = ownedVillains.length;
  const pct = totalOwned > 0 ? defeatedCount / totalOwned : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView contentContainerStyle={s.container}>
        <View style={s.headerRow}>
          <Text style={s.screenTitle}>Villains</Text>
          <View style={s.toggleRow}>
            <Text style={[s.toggleLabel, showAll && { color: C.warning }]}>
              {showAll ? 'All' : 'My collection'}
            </Text>
            <Switch value={showAll} onValueChange={setShowAll}
              trackColor={{ false: C.border, true: C.info }}
              thumbColor={C.text} />
          </View>
        </View>

        {/* Barra de progreso global */}
        {totalOwned > 0 && (
          <View style={s.progressCard}>
            <View style={s.progressTopRow}>
              <Text style={s.progressLabel}>
                {activeDeck ? `${activeDeck.name}` : 'No active deck'}
              </Text>
              <Text style={s.progressPct}>{Math.round(pct * 100)}%</Text>
            </View>
            <View style={s.progressBg}>
              <View style={[s.progressFill, {
                width: `${Math.round(pct * 100)}%` as any,
                backgroundColor: pct >= 1 ? C.success : C.info,
              }]} />
            </View>
            <Text style={s.progressSub}>{defeatedCount}/{totalOwned} villains defeated</Text>
          </View>
        )}

        <ActiveDeckBanner activeDeck={activeDeck} />
        {filteredSets.length === 0 && (
          <View style={s.emptyState}>
            <Text style={s.emptyTitle}>No villains in your collection</Text>
            <Text style={s.empty}>Add sets in Mi Colección or enable "All".</Text>
          </View>
        )}
        {filteredSets.map(({ cycle, villains }) => (
          <View key={cycle}>
            <Text style={s.cycleLabel}>{cycle}</Text>
            <View style={s.grid}>
              {villains.map(vName => {
                const defeated = activeDeck?.villains?.[vName]?.defeated ?? false;
                const total = decks.filter(d => d.villains?.[vName]?.defeated).length;
                return (
                  <View key={vName} style={[s.vCard, defeated && s.vCardDone]}>
                    <Pressable style={s.vCardMain} onPress={() => setOpen(vName)}>
                      <View style={{ position: 'relative' }}>
                        <VillainImage name={vName} size="small" />
                        {defeated && (
                          <View style={s.badge}>
                            <Text style={s.badgeTxt}>✓</Text>
                          </View>
                        )}
                      </View>
                      <View style={s.vInfo}>
                        <Text style={s.vName} numberOfLines={1}>{vName}</Text>
                        <Text style={[s.vStatus, { color: defeated ? C.success : C.textMuted }]}>
                          {defeated ? 'Defeated' : vName.endsWith('(L)') ? 'Leader' : 'Pending'}
                          {total > 1 ? ` · ${total} decks` : ''}
                        </Text>
                      </View>
                    </Pressable>
                    {/* Quick-defeat button */}
                    {activeDeck && (
                      <Pressable
                        style={[s.quickBtn, defeated && s.quickBtnDone]}
                        onPress={() => toggleDefeated(vName)}
                        hitSlop={4}>
                        <Text style={[s.quickTxt, defeated && { color: C.success }]}>
                          {defeated ? '✓' : '○'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function getStyles(C: typeof import("@/styles/theme").DarkColors) {
  return StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  container:{padding:Spacing.lg,gap:12,paddingBottom:30},
  screenTitle:{fontSize:22,fontWeight:'700',color:C.text},
  headerRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  toggleRow:{flexDirection:'row',alignItems:'center',gap:8},
  toggleLabel:{fontSize:12,color:C.textMuted},
  cycleLabel:{fontSize:11,color:C.textMuted,fontWeight:'700',marginBottom:6,marginTop:4,letterSpacing:0.5,textTransform:'uppercase'},
  grid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  progressCard:  { backgroundColor:C.surface, borderRadius:Radius.lg, borderWidth:1, borderColor:C.border, padding:Spacing.md, gap:4 },
  progressTopRow:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  progressLabel: { fontSize:12, color:C.text, fontWeight:'600', flex:1 },
  progressPct:   { fontSize:14, fontWeight:'800', color:C.info },
  progressBg:    { height:6, backgroundColor:C.border, borderRadius:3, overflow:'hidden' },
  progressFill:  { height:6, borderRadius:3 },
  progressSub:   { fontSize:11, color:C.textMuted },
  vCard:{width:104,borderWidth:1,borderColor:C.border,borderRadius:Radius.lg,overflow:'hidden',backgroundColor:C.surface},
  vCardMain:{ flex:1 },
  quickBtn:{ borderTopWidth:1, borderTopColor:C.border, paddingVertical:6, alignItems:'center' },
  quickBtnDone:{ borderTopColor:C.success+'44', backgroundColor:C.success+'11' },
  quickTxt:{ fontSize:16, color:C.textMuted },
  vCardDone:{borderColor:C.success+'66',backgroundColor:C.surface},
  vInfo:{padding:8,gap:2},
  vName:{fontSize:12,fontWeight:'600',color:C.text},
  vStatus:{fontSize:11},
  badge:{position:'absolute',top:4,right:4,width:22,height:22,borderRadius:11,backgroundColor:C.success,justifyContent:'center',alignItems:'center'},
  badgeTxt:{color:'#0f0f0d',fontSize:12,fontWeight:'700'},
  backBtn:{alignSelf:'flex-start',marginBottom:8},
  backTxt:{fontSize:13,color:C.textSub},
  detailImg:{borderWidth:2,borderColor:C.borderStrong,borderRadius:Radius.lg,overflow:'hidden',height:220,position:'relative'},
  defeatedOverlay:{position:'absolute',bottom:0,left:0,right:0,backgroundColor:'rgba(93,202,165,0.85)',paddingVertical:6,alignItems:'center'},
  defeatedTxt:{color:'#0f0f0d',fontWeight:'700',fontSize:14,letterSpacing:1},
  villainTitle:{fontSize:22,fontWeight:'700',color:C.text},
  missingBanner:{borderWidth:1,borderColor:C.warning+'55',backgroundColor:C.warningBg,borderRadius:Radius.md,padding:Spacing.sm},
  missingTxt:{fontSize:12,color:C.warning},
  card:{borderWidth:1,borderRadius:Radius.md,padding:Spacing.md,backgroundColor:C.surface},
  checkRow:{flexDirection:'row',alignItems:'center',gap:12},
  cb:{width:22,height:22,borderRadius:5,borderWidth:1.5,borderColor:C.borderStrong,justifyContent:'center',alignItems:'center'},
  cbDone:{backgroundColor:C.success,borderColor:C.success},
  check:{color:'#0f0f0d',fontSize:13,fontWeight:'700'},
  checkLabel:{fontSize:14,color:C.text,fontWeight:'500'},
  sectionTitle:{fontSize:14,fontWeight:'600',color:C.text},
  empty:{fontSize:13,color:C.textMuted},
  emptyState:{borderWidth:1,borderColor:C.border,borderRadius:Radius.lg,padding:Spacing.lg,alignItems:'center',gap:8},
  emptyTitle:{fontSize:15,fontWeight:'600',color:C.text},
  histRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:C.border,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:C.surface},
  histDeck:{fontSize:13,fontWeight:'600'},
  histHero:{fontSize:11,color:C.textMuted},
});
}

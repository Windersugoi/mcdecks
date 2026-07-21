import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { DeckEditor } from '@/components/DeckEditor';
import { HERO_CARDS, ASPECT_CARDS, SET_CATALOG } from '@/data/cards';
import { deckTitleColor } from '@/utils/deckUtils';
import { displayAspect, HERO_TO_SET } from '@/data/constants';
import { Colors, Radius, Spacing } from '@/styles/theme';

export default function MazosScreen() {
  const { decks, setDecks, activeDeckId, setActiveDeckId, activeDeck, createDeck, ownedSets, setOwnedSets, makeDeckTracking } = useApp();
  const [openDeckId, setOpenDeckId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);

  function confirmDelete(deckId: string, deckName: string) {
    Alert.alert('Delete deck', `Delete "${deckName}"? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        setDecks(prev => prev.filter(d => d.id !== deckId));
        if (activeDeckId === deckId) setActiveDeckId(null);
      }},
    ]);
  }

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    try {
      // Extraer ID de la URL o número
      const urlMatch = importUrl.match(/\/view\/(\d+)/) ||
                       importUrl.match(/\/(\d{3,})/) ||
                       importUrl.match(/^(\d+)$/);
      if (!urlMatch) throw new Error('Enter a valid deck URL or ID');
      const deckId = urlMatch[1];

      const resp = await fetch(`https://marvelcdb.com/api/public/decklist/${deckId}`);
      if (!resp.ok) throw new Error(`Deck not found (${resp.status}). Make sure it is public.`);
      const mcdbDeck = await resp.json();

      // ── Mapeo DIRECTO: código marvelcdb (5 dígitos) → nuestro cardId ──────
      // Nuestras cartas usan imgsrc numérico: ".../01058.png"
      // El código marvelcdb en los slots es: "01058"
      // Coincidencia: extraer los 5 dígitos numéricos del imgsrc y comparar
      const codeToId: Record<string, string> = {};

      // Aspect + Basic cards
      for (const c of ASPECT_CARDS) {
        if (!c.imgsrc) continue;
        const m = c.imgsrc.match(/\/(\d{5})[a-z]?\.png$/i);
        if (m && !codeToId[m[1]]) codeToId[m[1]] = c.id;
      }
      // Hero deck cards (excluir identidad)
      for (const heroCards of Object.values(HERO_CARDS)) {
        for (const c of heroCards) {
          if (!c.imgsrc || c.isIdentity) continue;
          const m = c.imgsrc.match(/\/(\d{5})[a-z]?\.png$/i);
          if (m && !codeToId[m[1]]) codeToId[m[1]] = c.id;
        }
      }

      // ── Mapear slots del mazo ────────────────────────────────────────────
      const importedCards: Record<string, number> = {};
      const missing: string[] = [];
      for (const [code, qty] of Object.entries(mcdbDeck.slots ?? {})) {
        const ourId = codeToId[code]; // code = "01058" → directo
        if (ourId) {
          importedCards[ourId] = qty as number;
        } else {
          missing.push(code);
        }
      }

      // ── Detectar héroe por investigator_code ─────────────────────────────
      const invCode = mcdbDeck.investigator_code ?? '';
      let matchedHero: string | null = null;

      // Buscar en HERO_CARDS la carta de identidad con ese código
      for (const [heroName, heroCards] of Object.entries(HERO_CARDS)) {
        const identity = heroCards.find(c => c.isIdentity && c.imgsrc);
        if (identity?.imgsrc) {
          const m = identity.imgsrc.match(/\/(\d{5})[a-z]?\.png$/i);
          if (m && m[1] === invCode) { matchedHero = heroName; break; }
        }
      }
      // Fallback: buscar por nombre
      if (!matchedHero && mcdbDeck.investigator_name) {
        const heroName = mcdbDeck.investigator_name.toLowerCase();
        matchedHero = Object.keys(HERO_CARDS).find(
          h => h.toLowerCase() === heroName || heroName.includes(h.toLowerCase())
        ) ?? null;
      }

      // ── Detectar aspecto de las cartas importadas ────────────────────────
      const aspectsFound = new Set<string>();
      for (const cardId of Object.keys(importedCards)) {
        const card = ASPECT_CARDS.find(c => c.id === cardId);
        if (card?.aspect && card.aspect !== 'Basic' && card.aspect !== 'Hero') {
          aspectsFound.add(card.aspect);
        }
      }
      const importedAspects = [...aspectsFound].slice(0, 2);

      // ── Crear mazo con todos los datos de una vez (sin race condition) ───
      const newId = 'd' + Date.now();
      setDecks(prev => [...prev, {
        id: newId,
        name: mcdbDeck.name ?? 'Imported Deck',
        hero: matchedHero,
        aspects: importedAspects,
        cards: importedCards,
        ...makeDeckTracking(),
      }]);

      setImportUrl('');
      setOpenDeckId(newId);
      setImportMsg(missing.length > 0
        ? `✓ Imported (${Object.keys(importedCards).length} cards, ${missing.length} not mapped)`
        : `✓ Imported: ${Object.keys(importedCards).length} cards`
      );
    } catch (err: any) {
      setImportMsg('✗ ' + (err.message ?? 'Import failed'));
    } finally {
      setImporting(false);
    }
  }

  if (openDeckId) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <DeckEditor decks={decks} setDecks={setDecks} deckId={openDeckId}
          onBack={() => setOpenDeckId(null)} ownedSets={ownedSets} showAll={showAll} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.appTitle}>MCDecks</Text>
  
      </View>
      {activeDeck && (
        <View style={s.activeBanner}>
          <Text style={[s.activeBannerDeck, { color: deckTitleColor(activeDeck) }]}>★ {activeDeck.name}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={s.list}>
        {decks.length === 0 && <Text style={s.empty}>No decks yet. Create your first one!</Text>}
        {decks.map(deck => {
          const isActive = deck.id === activeDeckId;
          // Un mazo es "completo" si tiene héroe asignado
          // La cuenta total incluye mandatory hero cards que ya están fijas
          // Excluir cartas de identidad (Hero/Alter-Ego) del conteo — no van al mazo
          const mandCount = deck.hero
            ? (HERO_CARDS[deck.hero] ?? [])
                .filter(c => !c.isIdentity && c.type !== 'Hero' && c.type !== 'Alter-Ego')
                .reduce((a,c)=>a+(c.qty??1),0)
            : 0;
          const total = mandCount + Object.values(deck.cards).reduce((a,q)=>a+q,0);
          const hasHero = !!deck.hero;
          const valid = hasHero && total >= 40;
          const color = deckTitleColor(deck);
          const heroSetCode = deck.hero ? HERO_TO_SET[deck.hero] : null;
          const heroOwned = !heroSetCode || showAll || !!ownedSets[heroSetCode];
          const heroSetName = heroSetCode ? (SET_CATALOG.find(s=>s.code===heroSetCode)?.name ?? heroSetCode) : null;
          return (
            <View key={deck.id} style={[s.deckCard, { borderColor: isActive ? color : valid ? Colors.border : Colors.danger }]}>
              {/* ★ Activar */}
              <Pressable onPress={() => setActiveDeckId(isActive ? null : deck.id)}
                style={[s.starBtn, isActive && { backgroundColor: color+'22', borderRightColor: color }]}>
                <Text style={[s.star, { color: isActive ? color : Colors.borderStrong }]}>
                  {isActive ? '★' : '☆'}
                </Text>
              </Pressable>
              {/* Cuerpo */}
              <Pressable onPress={() => setOpenDeckId(deck.id)} style={s.deckBody}>
                <View style={s.deckInfo}>
                  <Text style={[s.deckName, { color }]}>{deck.name}</Text>
                  <Text style={s.deckMeta}>
                    {deck.hero ?? 'No hero'} · {total} cards ·{' '}
                    {deck.aspects.length ? deck.aspects.map(displayAspect).join('/') : 'Basic'}
                  </Text>
                  {!heroOwned && heroSetName && (
                    <Text style={s.missingHero}>⚠ Missing pack: {heroSetName}</Text>
                  )}
                  {isActive && <Text style={[s.activeTag, { color }]}>★ Active deck</Text>}
                </View>
                {!valid && <View style={s.badge}><Text style={s.badgeTxt}>Incomplete</Text></View>}
              </Pressable>
              {/* 🗑 Borrar */}
              <Pressable onPress={() => confirmDelete(deck.id, deck.name)} style={s.trashBtn} hitSlop={8}>
                <Text style={s.trashIcon}>🗑</Text>
              </Pressable>
            </View>
          );
        })}
        <Pressable onPress={() => { const id=createDeck(); setOpenDeckId(id); }} style={s.newBtn}>
          <Text style={s.newBtnTxt}>+ New Deck</Text>
        </Pressable>

        {/* Import from marvelcdb */}
        <View style={s.importSection}>
          <Text style={s.importTitle}>Import from marvelcdb</Text>
          <View style={s.importRow2}>
            <TextInput
              placeholder="Deck URL or ID (e.g. 12345)"
              placeholderTextColor={Colors.textMuted}
              value={importUrl}
              onChangeText={v => { setImportUrl(v); setImportMsg(null); }}
              style={s.importInput}
              autoCapitalize="none" autoCorrect={false}
            />
            <Pressable onPress={!importing ? handleImport : undefined}
              style={[s.importBtn, importing && { opacity: 0.5 }]}>
              <Text style={s.importBtnTxt}>{importing ? '…' : 'Import'}</Text>
            </Pressable>
          </View>
          {importMsg && (
            <Text style={[s.importMsg, {
              color: importMsg.startsWith('✓') ? Colors.success : Colors.danger
            }]}>{importMsg}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:{flex:1,backgroundColor:Colors.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:Spacing.lg,paddingBottom:8},
  appTitle:{fontSize:20,fontWeight:'700',color:Colors.text,letterSpacing:-0.5},
  toggleRow:{flexDirection:'row',alignItems:'center',gap:8},
  toggleLabel:{fontSize:12,color:Colors.textMuted},
  activeBanner:{paddingHorizontal:Spacing.lg,paddingBottom:8},
  activeBannerDeck:{fontSize:12,fontWeight:'600'},
  list:{padding:Spacing.lg,paddingTop:4,gap:10,paddingBottom:30},
  empty:{fontSize:13,color:Colors.textMuted},
  deckCard:{flexDirection:'row',borderWidth:1,borderRadius:Radius.lg,overflow:'hidden',backgroundColor:Colors.surface},
  starBtn:{width:44,justifyContent:'center',alignItems:'center',borderRightWidth:1,borderRightColor:Colors.border},
  star:{fontSize:20},
  deckBody:{flex:1,flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:12},
  deckInfo:{flex:1,gap:2},
  deckName:{fontSize:15,fontWeight:'600'},
  deckMeta:{fontSize:12,color:Colors.textMuted},
  missingHero:{fontSize:11,color:Colors.warning,marginTop:2},
  activeTag:{fontSize:11,fontWeight:'600'},
  badge:{backgroundColor:'rgba(226,75,74,0.15)',borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  badgeTxt:{fontSize:11,color:Colors.danger},
  trashBtn:{width:44,justifyContent:'center',alignItems:'center',borderLeftWidth:1,borderLeftColor:Colors.border},
  trashIcon:{fontSize:18,opacity:0.5},
  newBtn:{borderWidth:1,borderStyle:'dashed',borderColor:Colors.borderStrong,borderRadius:Radius.lg,padding:14,alignItems:'center'},
  newBtnTxt:{fontSize:14,color:Colors.textSub},
  importSection:{borderWidth:2,borderColor:Colors.info,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:'#0d1a2d',gap:10},
  importTitle:{fontSize:14,fontWeight:'700',color:Colors.info},
  importRow2:{flexDirection:'row',gap:8,alignItems:'center'},
  importInput:{flex:1,backgroundColor:'#1a2a3d',borderWidth:1,borderColor:Colors.info,borderRadius:Radius.sm,color:'#ffffff',fontSize:13,paddingVertical:9,paddingHorizontal:12},
  importBtn:{paddingVertical:9,paddingHorizontal:16,borderRadius:Radius.md,backgroundColor:Colors.info,justifyContent:'center'},
  importBtnTxt:{fontSize:13,color:'#ffffff',fontWeight:'700'},
  importMsg:{fontSize:12},
});

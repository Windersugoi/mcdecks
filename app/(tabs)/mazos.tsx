import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Switch, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useApp } from '@/context/AppContext';
import { confirmAction } from '@/utils/dialogs';
import { DeckEditor } from '@/components/DeckEditor';
import { HERO_CARDS, ASPECT_CARDS, SET_CATALOG } from '@/data/cards';
import { deckTitleColor, aspectColor } from '@/utils/deckUtils';
import { displayAspect, HERO_TO_SET } from '@/data/constants';
import { suggestCards, matchDeckByQuery, DeckCardMatch } from '@/utils/cardSearch';
import { Colors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';

export default function MazosScreen() {
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const { decks, setDecks, activeDeckId, setActiveDeckId, activeDeck, createDeck, ownedSets, setOwnedSets, makeDeckTracking } = useApp();
  const [openDeckId, setOpenDeckId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [cardQuery, setCardQuery] = useState('');
  const [conflictInfo, setConflictInfo] = useState<{ cardName: string; deckNames: string[] }[] | null>(null);

  const cardQ = cardQuery.trim();
  const searchActive = cardQ.length >= 2;
  const suggestions = useMemo(() => suggestCards(cardQ), [cardQ]);
  // Oculta las sugerencias en cuanto el texto coincide EXACTO con una de ellas
  // (pasa al tocar una sugerencia, o al terminar de escribir el nombre completo).
  const hideSuggestions = suggestions.some(sc => sc.name.toLowerCase() === cardQ.toLowerCase());
  const cardMatches = useMemo(() => {
    if (!searchActive) return new Map<string, DeckCardMatch[]>();
    const map = new Map<string, DeckCardMatch[]>();
    for (const d of decks) {
      const m = matchDeckByQuery(d, cardQ);
      if (m.length) map.set(d.id, m);
    }
    return map;
  }, [decks, cardQ, searchActive]);
  const visibleDecks = searchActive ? decks.filter(d => cardMatches.has(d.id)) : decks;

  function confirmDelete(deckId: string, deckName: string) {
    confirmAction('Delete deck', `Delete "${deckName}"? This cannot be undone.`, () => {
      setDecks(prev => prev.filter(d => d.id !== deckId));
      if (activeDeckId === deckId) setActiveDeckId(null);
    });
  }

  // Compara cuántas copias reales hay (misma cuenta que effectiveOwned de
  // DeckEditor: suma qty de todos los sets poseídos con esta carta) contra
  // cuántas hacen falta aquí + cuántas ya están comprometidas en OTROS
  // mazos físicos. Solo es conflicto si no alcanza para todos — esto ya
  // cubre solo de forma natural a las básicas ubicuas (Energy/Genius/
  // Strength: qty 4 en el Core + 1 por cada caja de héroe), sin necesidad
  // de excluirlas a mano: con pocos mazos físicos nunca avisan, y si de
  // verdad se agotan (5-6 mazos desde una sola Core), sí debe avisar.
  function physicalConflicts(deck: typeof decks[number]) {
    const conflicts: { cardName: string; deckNames: string[] }[] = [];
    const otherPhysical = decks.filter(d => d.id !== deck.id && d.physical);
    for (const [cardId, qtyNeeded] of Object.entries(deck.cards)) {
      const card = ASPECT_CARDS.find(c => c.id === cardId);
      if (!card) continue;
      const sameCard = ASPECT_CARDS.filter(c => c.name === card.name && c.aspect === card.aspect);
      const totalOwned = sameCard.reduce((sum, c) =>
        sum + ((!c.setCode || ownedSets[c.setCode]) ? (c.qty ?? 1) : 0), 0);
      const usedByOthers = otherPhysical.reduce((total, d) =>
        total + sameCard.reduce((s, c) => s + (d.cards[c.id] ?? 0), 0), 0);
      if (usedByOthers + qtyNeeded > totalOwned) {
        const holders = otherPhysical
          .filter(d => sameCard.some(c => (d.cards[c.id] ?? 0) > 0))
          .map(d => d.name);
        conflicts.push({ cardName: card.name, deckNames: holders });
      }
    }
    return conflicts;
  }

  function togglePhysical(deck: typeof decks[number]) {
    if (!deck.physical) {
      const conflicts = physicalConflicts(deck);
      if (conflicts.length > 0) {
        setConflictInfo(conflicts);
        return;
      }
    }
    setDecks(prev => prev.map(d => d.id === deck.id ? { ...d, physical: !d.physical } : d));
  }

  async function handleImport() {
    setImporting(true);
    setImportMsg(null);
    try {
      // - 1. Extraer ID -
      const urlMatch = importUrl.match(/\/view\/(\d+)/) ||
                       importUrl.match(/\/(\d{3,})/) ||
                       importUrl.match(/^(\d+)$/);
      if (!urlMatch) throw new Error('Enter a valid deck URL or ID');
      const deckId = urlMatch[1];

      // - 2. Obtener el mazo de marvelcdb -
      const deckResp = await fetch(`https://marvelcdb.com/api/public/decklist/${deckId}`);
      if (!deckResp.ok) throw new Error(`Deck not found (${deckResp.status}). Make sure it is public.`);
      const mcdbDeck = await deckResp.json();

      // - 3. Obtener lista completa de cartas de marvelcdb -
      // Esto da los nombres reales de cada carta por su código
      const cardsResp = await fetch('https://marvelcdb.com/api/public/cards/');
      const mcdbAllCards: any[] = cardsResp.ok ? await cardsResp.json() : [];

      // Mapa: código marvelcdb → nombre de carta
      const codeToName: Record<string, string> = {};
      for (const card of mcdbAllCards) {
        if (card.code && card.name) codeToName[card.code] = card.name;
      }

      // - 4. Mapa: nombre → nuestro cardId (solo ASPECT_CARDS) -
      // Normalizar: quitar puntuación y espacios extra para matching flexible
      const normalize = (s: string) => s.toLowerCase()
        .replace(/['".,!?;:()\/\[\]{}-]/g, ' ')
        .replace(/\s+/g, ' ').trim();

      const nameToOurId: Record<string, string> = {};
      const normToOurId: Record<string, string> = {};
      // Mapa por CÓDIGO exacto de marvelcdb (extraído de nuestra propia URL
      // de imagen). Evita la ambigüedad de nombres repetidos en distintos
      // aspectos — p.ej. "Spider-Man" existe 8 veces en nuestra BD, cada
      // una en un aspecto distinto, y por nombre siempre se resolvía a la
      // primera del archivo sin mirar cuál hacía falta de verdad.
      const codeToOurId: Record<string, string> = {};
      const imgCode = (imgsrc?: string) => imgsrc?.match(/\/cards\/(\d+[a-z]?)\.(png|jpg)$/i)?.[1] ?? null;
      for (const c of ASPECT_CARDS) {
        const exact = c.name.toLowerCase();
        const norm  = normalize(c.name);
        if (!nameToOurId[exact]) nameToOurId[exact] = c.id;
        if (!normToOurId[norm])  normToOurId[norm]  = c.id;
        const code = imgCode(c.imgsrc);
        if (code && !codeToOurId[code]) codeToOurId[code] = c.id;
      }
      // Añadir aliados únicos de packs de héroe (Ghost-Spider, Hope Summers, etc.)
      // que otros héroes pueden usar via Make the Call u otros efectos
      for (const heroCards of Object.values(HERO_CARDS)) {
        for (const c of heroCards) {
          if (c.isIdentity) continue;
          const exact = c.name.toLowerCase();
          const norm  = normalize(c.name);
          if (!nameToOurId[exact]) nameToOurId[exact] = c.id;
          if (!normToOurId[norm])  normToOurId[norm]  = c.id;
          const code = imgCode(c.imgsrc);
          if (code && !codeToOurId[code]) codeToOurId[code] = c.id;
        }
      }

      // Packs conocidos en nuestra BD: hasta el 60 (Fear No Evil)
      const MAX_KNOWN_PACK = 60;
      const importedCards: Record<string, number> = {};
      const missing: string[] = [];
      for (const [code, qty] of Object.entries(mcdbDeck.slots ?? {})) {
        const packNum = parseInt(code.replace(/[a-z]/gi, '').substring(0, 2), 10);
        if (!isNaN(packNum) && packNum > MAX_KNOWN_PACK) {
          missing.push(code);
          continue;
        }
        const cardName = codeToName[code];
        // Primero por código exacto (sin ambigüedad de aspecto). Si no hay
        // match directo, caer al nombre como red de seguridad.
        const ourId = codeToOurId[code]
                   ?? (cardName ? (nameToOurId[cardName.toLowerCase()] ?? normToOurId[normalize(cardName)]) : null)
                   ?? null;
        if (ourId) {
          importedCards[ourId] = qty as number;
        } else if (cardName) {
          missing.push(cardName);
        } else {
          missing.push(code);
        }
      }

      // - 6. Detectar héroe -
      let matchedHero: string | null = null;
      const heroKeys = Object.keys(HERO_CARDS);

      // a) Por investigator_name directo
      const invName = (mcdbDeck.hero_name ?? '').toLowerCase().trim();
      if (invName) {
        matchedHero = heroKeys.find(h => h.toLowerCase() === invName) ??
                      heroKeys.find(h => invName.includes(h.toLowerCase())) ??
                      heroKeys.find(h => h.toLowerCase().includes(invName)) ??
                      null;
      }

      // b) Por nombre del investigador en el mapa de cartas
      if (!matchedHero && mcdbDeck.hero_code) {
        const invCardName = (codeToName[mcdbDeck.hero_code] ?? '').toLowerCase();
        if (invCardName) {
          matchedHero = heroKeys.find(h => invCardName.includes(h.toLowerCase())) ??
                        heroKeys.find(h => h.toLowerCase().includes(invCardName)) ??
                        null;
        }
      }

      // c) Por nombre del mazo (ej: "50ish Shades of Grey Gamora")
      if (!matchedHero && mcdbDeck.name) {
        const deckName = mcdbDeck.name.toLowerCase();
        matchedHero = heroKeys.find(h => deckName.includes(h.toLowerCase())) ?? null;
      }

      // - 7. Detectar aspecto de las cartas importadas -
      // ── 6. Detectar aspecto dominante (por copias, no por cartas únicas) ─
      // Evita que aliados sueltos de otro aspecto (ej: Ronin Leadership en
      // un mazo Agresión) causen detección incorrecta de múltiples aspectos.
      const aspectCount: Record<string, number> = {};
      for (const [cardId, qty] of Object.entries(importedCards)) {
        const card = ASPECT_CARDS.find(c => c.id === cardId);
        if (card?.aspect && card.aspect !== 'Basic' && card.aspect !== 'Hero') {
          aspectCount[card.aspect] = (aspectCount[card.aspect] ?? 0) + (qty as number);
        }
      }
      const sortedAspects = Object.entries(aspectCount)
        .sort(([,a],[,b]) => (b as number) - (a as number));
      // Incluir 2º aspecto solo si tiene ≥3 cartas (para Spider-Woman dual aspect)
      const importedAspects = sortedAspects
        .filter(([,count], i) => i === 0 || (count as number) >= 3)
        .map(([aspect]) => aspect)
        .slice(0, 2);

      // - 8. Eliminar cartas del propio héroe (se auto-añaden en DeckEditor) -
      // Usamos nameToOurId para encontrar el ID real con el que se importó cada carta,
      // evitando el problema de entradas duplicadas con IDs distintos en HERO_CARDS.
      // Se incluyen también las cartas de identidad: algunos héroes (Adam Warlock,
      // Maria Hill, Hercules...) comparten nombre con un aliado genérico de otro
      // aspecto, y marvelcdb siempre incluye la identidad en el mazo — sin esto,
      // esa carta ajena se colaría por error en el mazo importado.
      if (matchedHero && HERO_CARDS[matchedHero]) {
        const heroImportedIds = new Set<string>();
        for (const c of HERO_CARDS[matchedHero]) {
          const byCode = imgCode(c.imgsrc);
          const mappedId = (byCode ? codeToOurId[byCode] : null)
                         ?? nameToOurId[c.name.toLowerCase()]
                         ?? normToOurId[normalize(c.name)];
          if (mappedId) heroImportedIds.add(mappedId);
        }
        for (const id of Object.keys(importedCards)) {
          if (heroImportedIds.has(id)) delete importedCards[id];
        }
      }

      // - 9. Crear mazo -
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
      setImportMsg(
        `✓ ${matchedHero ?? 'Unknown hero'} · ` +
        `${Object.keys(importedCards).length} aspect cards imported` +
        (missing.length > 0 ? ` (${missing.length} hero cards auto-added)` : '')
      );

      // Abrir editor si se detectó el héroe
      if (matchedHero) {
        setOpenDeckId(newId);
      }



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
    <>
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <Text style={s.appTitle}>MCDecks</Text>
  
      </View>
      <View style={s.searchRow}>
        <TextInput
          placeholder="🔍 Buscar mazos por carta…"
          placeholderTextColor={C.textMuted}
          value={cardQuery}
          onChangeText={setCardQuery}
          style={s.searchInput}
          autoCapitalize="none" autoCorrect={false}
        />
        {cardQuery.length > 0 && (
          <Pressable onPress={() => setCardQuery('')} style={s.searchClear} hitSlop={8}>
            <Text style={s.searchClearTxt}>✕</Text>
          </Pressable>
        )}
      </View>
      {searchActive && !hideSuggestions && suggestions.length > 0 && (
        <View style={s.suggestBox}>
          {suggestions.map(sc => (
            <Pressable key={sc.key} onPress={() => setCardQuery(sc.name)} style={s.suggestRow}>
              <Text style={s.suggestName} numberOfLines={1}>{sc.name}</Text>
              {!!sc.aspect && (
                <Text style={[s.suggestAspect, { color: aspectColor(sc.aspect) }]}>
                  {displayAspect(sc.aspect)}
                </Text>
              )}
            </Pressable>
          ))}
        </View>
      )}
      {activeDeck && (
        <View style={s.activeBanner}>
          <Text style={[s.activeBannerDeck, { color: deckTitleColor(activeDeck) }]}>★ {activeDeck.name}</Text>
        </View>
      )}
      <ScrollView contentContainerStyle={s.list}>
        {decks.length === 0 && <Text style={s.empty}>No decks yet. Create your first one!</Text>}
        {searchActive && visibleDecks.length === 0 && (
          <Text style={s.empty}>Ningún mazo contiene "{cardQuery}".</Text>
        )}
        {visibleDecks.map(deck => {
          const isActive = deck.id === activeDeckId;
          // Un mazo es "completo" si tiene héroe asignado
          // La cuenta total incluye mandatory hero cards (pack de héroe, sin identidad)
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
            <View key={deck.id} style={[s.deckCard, { borderColor: isActive ? color : valid ? C.border : C.danger }]}>
              {/* ★ Activar */}
              <Pressable onPress={() => setActiveDeckId(isActive ? null : deck.id)}
                style={[s.starBtn, isActive && { backgroundColor: color+'22', borderRightColor: color }]}>
                <Text style={[s.star, { color: isActive ? color : C.borderStrong }]}>
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
                  {searchActive && cardMatches.has(deck.id) && (
                    <Text style={s.matchInfo} numberOfLines={1}>
                      🔍 {cardMatches.get(deck.id)!.map(m => `${m.qty}× ${m.name}`).join(', ')}
                    </Text>
                  )}
                  {isActive && <Text style={[s.activeTag, { color }]}>★ Active deck</Text>}
                </View>
                {!valid && <View style={s.badge}><Text style={s.badgeTxt}>Incomplete</Text></View>}
              </Pressable>
              {/* 📌 Reclamar cartas */}
              <Pressable
                onPress={() => togglePhysical(deck)}
                style={[s.claimBtn, deck.physical && s.claimBtnActive]}
                hitSlop={8}>
                <Text style={[s.claimIcon, { opacity: deck.physical ? 1 : 0.4 }]}>📍</Text>
              </Pressable>
              {/* 🗑 Borrar */}
              <Pressable onPress={() => confirmDelete(deck.id, deck.name)} style={s.trashBtn} hitSlop={8}>
                <View style={s.trashIconBox}>
                  <View style={s.trashHandle} />
                  <View style={s.trashLid} />
                  <View style={s.trashBody} />
                </View>
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
              placeholderTextColor={C.textMuted}
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
              color: importMsg.startsWith('✓') ? C.success : C.danger
            }]}>{importMsg}</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
    <Modal visible={conflictInfo !== null} transparent animationType="fade"
      onRequestClose={() => setConflictInfo(null)}>
      <Pressable style={s.modalBackdrop} onPress={() => setConflictInfo(null)}>
        <Pressable style={s.modalCard} onPress={e => e.stopPropagation()}>
          <Text style={s.modalBrand}>MCDecks</Text>
          <Text style={s.modalTitle}>No se puede marcar como físico</Text>
          <Text style={s.modalBody}>Estas cartas ya están reclamadas por otro mazo físico:</Text>
          <ScrollView style={s.modalList}>
            {conflictInfo?.map((c, i) => (
              <Text key={i} style={s.modalItem}>
                • {c.cardName} → {c.deckNames.map(n => `"${n}"`).join(', ')}
              </Text>
            ))}
          </ScrollView>
          <Text style={s.modalHint}>Quita el pin del otro mazo primero si quieres pasar las cartas a este.</Text>
          <Pressable style={s.modalBtn} onPress={() => setConflictInfo(null)}>
            <Text style={s.modalBtnTxt}>Aceptar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
    </>
  );
}

function getStyles(C: typeof import("@/styles/theme").DarkColors) {
  return StyleSheet.create({
  safe:{flex:1,backgroundColor:C.bg},
  header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:Spacing.lg,paddingBottom:8},
  appTitle:{fontSize:20,fontWeight:'700',color:C.text,letterSpacing:-0.5},
  toggleRow:{flexDirection:'row',alignItems:'center',gap:8},
  toggleLabel:{fontSize:12,color:C.textMuted},
  activeBanner:{paddingHorizontal:Spacing.lg,paddingBottom:8},
  activeBannerDeck:{fontSize:12,fontWeight:'600'},
  searchRow:{flexDirection:'row',alignItems:'center',marginHorizontal:Spacing.lg,marginBottom:8,
             backgroundColor:C.surface2,borderWidth:1,borderColor:C.border,borderRadius:Radius.md},
  searchInput:{flex:1,color:C.text,fontSize:13,paddingVertical:9,paddingHorizontal:12},
  searchClear:{paddingHorizontal:12,paddingVertical:9},
  searchClearTxt:{fontSize:14,color:C.textMuted},
  suggestBox:{marginHorizontal:Spacing.lg,marginBottom:8,borderWidth:1,borderColor:C.border,
              borderRadius:Radius.md,backgroundColor:C.surface,overflow:'hidden'},
  suggestRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:8,
              paddingVertical:9,paddingHorizontal:12,borderTopWidth:1,borderTopColor:C.border},
  suggestName:{flex:1,fontSize:13,color:C.text},
  suggestAspect:{fontSize:11,fontWeight:'600'},
  list:{padding:Spacing.lg,paddingTop:4,gap:10,paddingBottom:30},
  empty:{fontSize:13,color:C.textMuted},
  deckCard:{flexDirection:'row',borderWidth:1,borderRadius:Radius.lg,overflow:'hidden',backgroundColor:C.surface},
  starBtn:{width:44,justifyContent:'center',alignItems:'center',borderRightWidth:1,borderRightColor:C.border},
  star:{fontSize:20},
  deckBody:{flex:1,flexDirection:'row',justifyContent:'space-between',alignItems:'center',padding:12},
  deckInfo:{flex:1,gap:2},
  deckName:{fontSize:15,fontWeight:'600'},
  deckMeta:{fontSize:12,color:C.textMuted},
  missingHero:{fontSize:11,color:C.warning,marginTop:2},
  matchInfo:{fontSize:11,color:C.info,marginTop:2},
  activeTag:{fontSize:11,fontWeight:'600'},
  badge:{backgroundColor:'rgba(226,75,74,0.15)',borderRadius:6,paddingHorizontal:8,paddingVertical:2},
  badgeTxt:{fontSize:11,color:C.danger},
  trashBtn:{width:44,justifyContent:'center',alignItems:'center',borderLeftWidth:1,borderLeftColor:C.border},
  trashIconBox:{width:18,height:18,alignItems:'center'},
  trashHandle:{width:6,height:3,borderTopLeftRadius:2,borderTopRightRadius:2,backgroundColor:C.danger,marginBottom:1},
  trashLid:{width:17,height:2.5,borderRadius:1,backgroundColor:C.danger,marginBottom:1.5},
  trashBody:{width:12,height:11,borderBottomLeftRadius:2.5,borderBottomRightRadius:2.5,backgroundColor:C.danger},
  claimIcon:{fontSize:16,opacity:0.7},
  newBtn:{borderWidth:1,borderStyle:'dashed',borderColor:C.borderStrong,borderRadius:Radius.lg,padding:14,alignItems:'center'},
  newBtnTxt:{fontSize:14,color:C.textSub},
  claimBtn:{padding:8,borderRadius:Radius.sm,borderWidth:1,borderColor:'transparent'},
  claimBtnActive:{borderColor:C.warning+'88',backgroundColor:C.warning+'22'},
  claimBtnTxt:{fontSize:16},
  importSection:{borderWidth:2,borderColor:C.info,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:C.surface,gap:10},
  importTitle:{fontSize:14,fontWeight:'700',color:C.info},
  importRow2:{flexDirection:'row',gap:8,alignItems:'center'},
  importInput:{flex:1,backgroundColor:C.surface2,borderWidth:1,borderColor:C.info,borderRadius:Radius.sm,color:C.text,fontSize:13,paddingVertical:9,paddingHorizontal:12},
  importBtn:{paddingVertical:9,paddingHorizontal:16,borderRadius:Radius.md,backgroundColor:C.info,justifyContent:'center'},
  importBtnTxt:{fontSize:13,color:'#ffffff',fontWeight:'700'},
  importMsg:{fontSize:12},
  modalBackdrop:{flex:1,backgroundColor:'#00000099',justifyContent:'center',alignItems:'center',padding:Spacing.lg},
  modalCard:{backgroundColor:C.surface,borderRadius:Radius.lg,borderWidth:1,borderColor:C.border,padding:Spacing.lg,gap:8,maxWidth:420,width:'100%'},
  modalBrand:{fontSize:11,fontWeight:'700',color:C.textMuted,letterSpacing:1},
  modalTitle:{fontSize:16,fontWeight:'700',color:C.danger},
  modalBody:{fontSize:13,color:C.text},
  modalList:{maxHeight:160},
  modalItem:{fontSize:13,color:C.text,marginBottom:4},
  modalHint:{fontSize:12,color:C.textMuted,marginTop:4},
  modalBtn:{marginTop:8,backgroundColor:C.info,borderRadius:Radius.md,paddingVertical:11,alignItems:'center'},
  modalBtnTxt:{fontSize:14,fontWeight:'700',color:'#ffffff'},
});
}

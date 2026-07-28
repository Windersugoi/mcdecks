import React, { useState, useMemo } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Switch } from 'react-native';
import { Deck, Card, OwnedSets } from '@/data/types';
import { ASPECT_CARDS, HERO_CARDS, NEMESIS_CARDS, SET_CATALOG } from '@/data/cards';
import { ASPECT_LIST, MULTI_ASPECT_HEROES, displayAspect, DECK_MIN, DECK_MAX, HERO_SETS_BY_CYCLE, HERO_TO_SET, COMING_SOON_HEROES } from '@/data/constants';
import { aspectColor, deckTitleColor, usedElsewhere } from '@/utils/deckUtils';
import { Colors, Radius, Spacing } from '@/styles/theme';
import { Pill } from './Pill';
import { DeckCardRow } from './DeckCardRow';
import { PoolCardRow } from './PoolCardRow';
import { CardPreviewModal } from './CardPreviewModal';

interface Props {
  decks: Deck[]; setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  deckId: string; onBack: () => void;
  ownedSets: OwnedSets; showAll: boolean;
}

export function DeckEditor({ decks, setDecks, deckId, onBack, ownedSets, showAll }: Props) {
  const deck = decks.find(d => d.id === deckId);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name'|'aspect'>('name');
  const [localShowAll, setLocalShowAll] = useState(showAll);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(deck?.name ?? '');
  const [showNemesis, setShowNemesis] = useState(false);
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [importUrl, setImportUrl] = useState('');

  if (!deck) {
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.container}>
        <Pressable onPress={onBack} style={s.backBtn}><Text style={s.backTxt}>← Decks</Text></Pressable>
        <Text style={s.heroTitle}>Deck not found</Text>
      </ScrollView>
    );
  }

  const heroRule = MULTI_ASPECT_HEROES[deck.hero ?? ''] ?? null;
  const isMulti = !!heroRule;

  function update(patch: Partial<Deck>) {
    setDecks(prev => prev.map(d => d.id === deckId ? { ...d, ...patch } : d));
  }

  function toggleAspect(aspect: string) {
    const has = deck.aspects.includes(aspect);

    // Basic: toggle independiente, siempre combinable
    if (aspect === 'Basic') {
      update({ aspects: has
        ? deck.aspects.filter(a => a !== 'Basic')
        : [...deck.aspects, 'Basic']
      });
      return;
    }

    // Pool: solo si Deadpool está en colección
    if (aspect === 'Pool' && !deadpoolOwned) return;

    // Deseleccionar: siempre permitido (las cartas en conflicto quedan marcadas en rojo)
    if (has) {
      update({ aspects: deck.aspects.filter(a => a !== aspect) });
      return;
    }

    // Reglas especiales
    if (isMulti) {
      if (heroRule.rule === 'all4') { update({ aspects: [...ASPECT_LIST] }); return; }
      if (heroRule.rule === 'dual' && deck.aspects.length >= 2) return;
      update({ aspects: [...deck.aspects, aspect] });
      return;
    }

    // Normal: reemplazar aspecto principal, conservar Basic
    const keepBasic = deck.aspects.includes('Basic');
    update({ aspects: keepBasic ? [aspect, 'Basic'] : [aspect] });
  }

  function changeQty(cardId: string, delta: number) {
    const current = deck.cards[cardId] ?? 0;
    const card = ASPECT_CARDS.find(c => c.id === cardId);
    const hardMax = card?.maxPerDeck ?? 4;
    const next = Math.min(hardMax, Math.max(0, current + delta));
    const cards = { ...deck.cards };
    if (next === 0) delete cards[cardId]; else cards[cardId] = next;
    update({ cards });
  }

  // Compute effective owned based on collection
  // Suma copias de TODOS los sets poseídos que incluyen esta carta.
  // Energy en Core + Energy en Thor + Energy en Cap = 3 copias si tienes los 3 sets.
  function effectiveOwned(card: Card): number {
    if (localShowAll) return 99;
    return ASPECT_CARDS
      .filter(c => c.name === card.name && c.aspect === card.aspect)
      .reduce((sum, c) => {
        const owned = !c.setCode || ownedSets[c.setCode];
        return sum + (owned ? (c.qty ?? 1) : 0);
      }, 0);
  }

  // Active aspect: detected from cards in deck, or selected
  const detectedAspect = (() => {
    const aspects = new Set<string>();
    for (const id of Object.keys(deck.cards)) {
      const card = ASPECT_CARDS.find(c => c.id === id);
      if (card?.aspect && card.aspect !== 'Basic' && card.aspect !== 'Hero') aspects.add(card.aspect);
    }
    return aspects.size === 1 ? [...aspects][0] : null;
  })();
  // Aspecto activo = el detectado de las cartas, o el seleccionado manualmente (excluyendo Basic)
  const activeAspect = detectedAspect ?? (deck.aspects.find(a => a !== 'Basic') ?? null);

  // Basic siempre aparece — se puede seleccionar junto a cualquier aspecto
  // Pool aparece siempre pero bloqueado si no tienes Deadpool en colección
  const deadpoolOwned = ownedSets['X:D'] || localShowAll;
  const availableAspects = [
    'Aggression', 'Justice', 'Leadership', 'Protection',
    'Basic',
    'Pool',
  ];

  const mandatory = HERO_CARDS[deck.hero ?? ''] ?? [];
  const nemesis   = NEMESIS_CARDS[deck.hero ?? ''] ?? [];
  const identityCards = mandatory.filter(c => c.type === 'Hero' || c.type === 'Alter-Ego');
  const deckMandatory = mandatory.filter(c => c.type !== 'Hero' && c.type !== 'Alter-Ego');
  const mandCount = deckMandatory.reduce((a, c) => a + (c.qty ?? 1), 0);
  const optCount  = Object.values(deck.cards).reduce((a, q) => a + q, 0);
  const total     = mandCount + optCount;
  const deckFull  = total >= DECK_MAX;
  const deckReady = total >= DECK_MIN;
  const countColor = deckFull ? Colors.danger : deckReady ? Colors.success : Colors.warning;

  const poolCards = useMemo(() => {
    const filtered = ASPECT_CARDS.filter(c => {
      if (deck.cards[c.id]) return false;
      // Collection filter
      const inCollection = c.setCode ? !!ownedSets[c.setCode] : true;
      if (!localShowAll && !inCollection) return false;
      // Aspect filter: usa activeAspect que tiene en cuenta las cartas del mazo
      // (si deseleccionas un aspecto pero tienes cartas de ese aspecto, sigue filtrando)
      const basicOnly = deck.aspects.includes('Basic') && !activeAspect;
      if (basicOnly) {
        // Solo Basic seleccionado explícitamente sin ningún otro aspecto activo
        if (c.aspect !== 'Basic') return false;
      } else if (activeAspect) {
        // Hay un aspecto activo: mostrar solo ese aspecto + Basic siempre
        if (c.aspect !== 'Basic' && c.aspect !== activeAspect) return false;
      }
      // Sin aspecto activo y sin Basic solo = mostrar todo
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (typeFilter !== 'All' && c.type !== typeFilter) return false;
      return true;
    });

    // Deduplicar solo cuando son la MISMA carta (mismo nombre + mismo aspecto).
    // Cartas distintas con mismo nombre pero diferente aspecto se muestran ambas
    // Ej: Daredevil Justice (Core) y Daredevil Protection (SP//dr) → ambas visibles
    // Ej: Energy Basic en 25 sets → mostrar solo la mejor versión
    function score(c: Card): number {
      const owned = !c.setCode || ownedSets[c.setCode] ? 2 : 0;
      const hasImg = c.imgsrc ? 1 : 0;
      return owned + hasImg;
    }
    const byNameAspect = new Map<string, Card>();
    for (const c of filtered) {
      // Clave única = nombre + aspecto (diferencia Daredevil Justice vs Protection)
      const key = `${c.name}||${c.aspect ?? ''}`;
      const existing = byNameAspect.get(key);
      if (!existing || score(c) > score(existing)) {
        byNameAspect.set(key, c);
      }
    }
    return [...byNameAspect.values()].sort((a, b) =>
      sortBy === 'name' ? a.name.localeCompare(b.name) : (a.aspect ?? '').localeCompare(b.aspect ?? '')
    );
  }, [deck.cards, deck.aspects, activeAspect, search, typeFilter, sortBy, ownedSets, localShowAll]);

  // ── Hero selector ─────────────────────────────────────────────────────────
  if (!deck.hero) {
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.container}>
        <Pressable onPress={onBack} style={s.backBtn}><Text style={s.backTxt}>← Decks</Text></Pressable>
        <Text style={s.heroTitle}>Choose your hero</Text>
        <Text style={s.sub}>Hero cards and nemesis set are added automatically.</Text>
        {Object.entries(HERO_SETS_BY_CYCLE).map(([cycle, heroes]) => (
          <View key={cycle}>
            <Text style={s.cycleLabel}>{cycle}</Text>
            {heroes.map(h => {
              const hCode = HERO_TO_SET[h];
              const owned = localShowAll || !hCode || !!ownedSets[hCode] || COMING_SOON_HEROES.has(h);
              const setName = hCode ? (SET_CATALOG.find(x => x.code === hCode)?.name ?? hCode) : null;
              const isSoon = COMING_SOON_HEROES.has(h);
              return (
                <Pressable key={h} onPress={() => { update({ hero: h }); setNameDraft(h); }}
                  style={[s.heroRow, !owned && !isSoon && s.heroRowMissing, isSoon && s.heroRowSoon]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.heroName, !owned && !isSoon && { color: Colors.textMuted }]}>{h}</Text>
                    {isSoon
                      ? <Text style={s.soonLabel}>★ Coming Soon — cards not yet on marvelcdb</Text>
                      : (!owned && setName && <Text style={s.missingSet}>⚠ Missing: {setName}</Text>)
                    }
                  </View>
                  {MULTI_ASPECT_HEROES[h] && <Text style={s.specialBadge}>Special</Text>}
                  <Text style={{ color: Colors.textMuted, marginLeft: 8 }}>→</Text>
                </Pressable>
              );
            })}
          </View>
        ))}
      </ScrollView>
    );
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={s.container}>
      <CardPreviewModal card={previewCard} onClose={() => setPreviewCard(null)} />
      <Pressable onPress={onBack} style={s.backBtn}><Text style={s.backTxt}>← Decks</Text></Pressable>

      {editingName ? (
        <TextInput autoFocus value={nameDraft} onChangeText={setNameDraft}
          onBlur={() => { update({ name: nameDraft.trim() || deck.name }); setEditingName(false); }}
          onSubmitEditing={() => { update({ name: nameDraft.trim() || deck.name }); setEditingName(false); }}
          style={[s.deckTitle, { color: deckTitleColor(deck), borderBottomColor: deckTitleColor(deck) }]} />
      ) : (
        <Pressable onPress={() => setEditingName(true)}>
          <Text style={[s.deckTitle, { color: deckTitleColor(deck) }]}>{deck.name} ✎</Text>
        </Pressable>
      )}
      <Text style={s.sub}>Hero: {deck.hero}</Text>

      {/* Summary */}
      <View style={[s.summaryCard, { borderColor: countColor + '88' }]}>
        <View style={s.summaryRow}>
          <Text style={s.summaryLabel}>Deck cards</Text>
          <Text style={[s.summaryCount, { color: countColor }]}>{total}/{DECK_MAX}</Text>
        </View>
        <Text style={s.summaryDetail}>
          {mandCount} hero + {optCount} aspect/basic
          {deckFull ? ' · Full' : !deckReady ? ` · Need ${DECK_MIN - total} more` : ' · Ready ✓'}
        </Text>
      </View>

      {/* Identity cards */}
      {identityCards.length > 0 && (
        <View>
          <Text style={s.sectionTitle}>Identity — {deck.hero}</Text>
          {identityCards.map(card => (
            <Pressable key={card.id} onPress={() => setPreviewCard(card)}
              style={[s.row, { opacity: 0.75, borderColor: Colors.info + '44' }]}>
              <View style={{ flex: 1 }}>
                <Text style={s.cardName}>{card.name}</Text>
                <Text style={s.cardSub}>{card.type} · Set aside</Text>
              </View>
              <View style={[s.lockedBadge, { borderColor: Colors.info + '66' }]}>
                <Text style={[s.lockedTxt, { color: Colors.info }]}>Identity</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}

      {/* Mandatory deck cards */}
      <View>
        <Text style={s.sectionTitle}>{deck.hero} deck cards ({mandCount})</Text>
        {deckMandatory.map(card => (
          <Pressable key={card.id} onPress={() => setPreviewCard(card)}
            style={[s.row, { opacity: 0.85 }]}>
            <View style={{ flex: 1 }}>
              <Text style={s.cardName}>{card.qty}x {card.name}</Text>
              <Text style={s.cardSub}>{card.type.replace(/\([A-Z]+\)/g,'').trim()}</Text>
            </View>
            <View style={s.lockedBadge}><Text style={s.lockedTxt}>Mandatory</Text></View>
          </Pressable>
        ))}
      </View>

      {/* Aspect cards in deck */}
      <View>
        <View style={s.sectionRow}>
          <Text style={s.sectionTitle}>Aspect cards</Text>
          <Text style={[s.counter, { color: countColor }]}>{optCount}/{DECK_MAX - mandCount}</Text>
        </View>
        {Object.entries(deck.cards).length === 0 && (
          <Text style={s.emptyHint}>Add cards from the pool below.</Text>
        )}
        {Object.entries(deck.cards).map(([cardId, qty]) => {
          const card = ASPECT_CARDS.find(c => c.id === cardId);
          if (!card) return null;
          const owned = effectiveOwned(card);
          return (
            <DeckCardRow key={cardId} card={{ ...card, owned }} qty={qty} decks={decks}
              deckId={deckId} deckFull={deckFull}
              setName={!localShowAll && card.setCode && !ownedSets[card.setCode]
                ? (SET_CATALOG.find(s => s.code === card.setCode)?.name ?? card.setCode)
                : undefined}
              onChange={d => changeQty(cardId, d)} onPreview={setPreviewCard} />
          );
        })}
      </View>

      {/* Aspect selector */}
      <View style={s.aspectSelector}>
        <View style={s.aspectSelectorHeader}>
          <Text style={s.sectionTitle}>Aspect</Text>
          {detectedAspect && (
            <Text style={s.aspectLocked}>🔒 {detectedAspect} (remove cards to change)</Text>
          )}
        </View>
        {isMulti && <View style={s.specialNote}><Text style={s.specialNoteTxt}>{heroRule.note}</Text></View>}
        <View style={s.pillRow}>
          {availableAspects.map(a => {
            const active = deck.aspects.includes(a) || (a !== 'Basic' && detectedAspect === a);
            // Pool bloqueado si no tienes Deadpool en colección
            const poolLocked = a === 'Pool' && !deadpoolOwned;
            // El aspecto principal activo (seleccionado o detectado de cartas)
            const selectedMain = detectedAspect ?? deck.aspects.find(x => x !== 'Basic') ?? null;
            // Bloquear si ya hay OTRO aspecto principal activo (Basic nunca se bloquea así)
            const mainLocked = a !== 'Basic' && !!selectedMain && selectedMain !== a && !isMulti;
            const locked = poolLocked || mainLocked || (heroRule?.rule === 'all4');
            const color = a === 'Pool' ? '#CC6699' : a === 'Basic' ? Colors.textMuted : aspectColor(a);
            return (
              <Pill key={a} color={color} active={active} locked={locked}
                onPress={() => !locked && toggleAspect(a)}>
                {a}{a === 'Pool' && !deadpoolOwned ? ' 🔒' : ''}
              </Pill>
            );
          })}
          {!isMulti && !detectedAspect && deck.aspects.filter(a => a !== 'Basic').length === 0 && (
            <Pill color={Colors.info} active={true} onPress={() => {}}>All aspects</Pill>
          )}
        </View>
        <Text style={s.sub}>
          {deck.aspects.length === 0
            ? 'No aspect selected — showing all cards'
            : deck.aspects.filter(a => a !== 'Basic').map(a => a).join(' + ')
              + (deck.aspects.includes('Basic') ? ' + Basic' : ' + Basic (always)')
          }
        </Text>
      </View>

      {/* Pool */}
      <View>
        <Text style={s.sectionTitle}>Add cards</Text>
        <TextInput placeholder="Search..." placeholderTextColor={Colors.textMuted}
          value={search} onChangeText={setSearch} style={s.searchInput} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['All','Ally','Event','Support','Upgrade','Resource'].map(t => (
              <Pressable key={t} onPress={() => setTypeFilter(t)}
                style={[s.chip, typeFilter === t && s.chipActive]}>
                <Text style={[s.chipTxt, typeFilter === t && s.chipTxtActive]}>{t}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, alignItems: 'center' }}>
          {(['name','aspect'] as const).map(sv => (
            <Pressable key={sv} onPress={() => setSortBy(sv)}
              style={[s.chip, sortBy === sv && s.chipActive]}>
              <Text style={[s.chipTxt, sortBy === sv && s.chipTxtActive]}>{sv === 'name' ? 'A-Z' : 'Aspect'}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setLocalShowAll(v => !v)}
            style={[s.chip, localShowAll && { borderColor: Colors.warning }]}>
            <Text style={[s.chipTxt, localShowAll && { color: Colors.warning }]}>
              {localShowAll ? 'All cards' : 'My collection'}
            </Text>
          </Pressable>
        </View>
        <Text style={s.poolHint}>
          {activeAspect ? `${activeAspect} + Basic` : 'All aspects + Basic'}
          {!localShowAll ? ' · My collection' : ''}
        </Text>
        {poolCards.map(card => (
          <PoolCardRow key={card.id} card={{ ...card, owned: effectiveOwned(card) }}
            decks={decks} deckId={deckId} deckFull={deckFull}
            onAdd={() => changeQty(card.id, 1)} onPreview={setPreviewCard} />
        ))}
        {poolCards.length === 0 && (
          <Text style={s.emptyHint}>
            {!localShowAll ? 'No cards in collection. Tap "My collection" to see all.' : 'No cards match.'}
          </Text>
        )}
      </View>

      {/* Nemesis */}
      <Pressable onPress={() => setShowNemesis(v => !v)} style={s.smallBtn}>
        <Text style={s.smallBtnTxt}>{showNemesis ? 'Hide' : 'Show'} {deck.hero} nemesis</Text>
      </Pressable>
      {showNemesis && nemesis.map(c => (
        <View key={c.id} style={[s.row, { opacity: 0.6 }]}>
          <Text style={s.cardName}>{c.qty}x {c.name}</Text>
          <Text style={s.cardSub}>{c.type}</Text>
        </View>
      ))}

      <Pressable style={s.exportBtn}><Text style={s.exportTxt}>⤒ Export to marvelcdb</Text></Pressable>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:{flex:1,backgroundColor:Colors.bg},
  container:{padding:Spacing.lg,gap:14,paddingBottom:40},
  backBtn:{alignSelf:'flex-start'},backTxt:{color:Colors.textSub,fontSize:13},
  deckTitle:{fontSize:19,fontWeight:'700',borderBottomWidth:2},
  heroTitle:{fontSize:18,fontWeight:'600',color:Colors.text},
  sub:{fontSize:12,color:Colors.textMuted},
  heroRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:10,backgroundColor:Colors.surface,marginBottom:5},
  heroRowMissing:{borderColor:Colors.warning+'44',backgroundColor:'#1a1500'},
  heroName:{fontSize:14,fontWeight:'600',color:Colors.text},
  cycleLabel:{fontSize:11,color:Colors.textMuted,fontWeight:'700',marginBottom:4,marginTop:8,textTransform:'uppercase',letterSpacing:0.5},
  specialBadge:{fontSize:10,color:Colors.warning,borderWidth:1,borderColor:Colors.warning,borderRadius:4,paddingHorizontal:5,paddingVertical:2},
  heroRowSoon:{borderColor:Colors.info+'44',backgroundColor:'#0d1220'},
  soonLabel:{fontSize:11,color:Colors.info,marginTop:1},
  missingSet:{fontSize:11,color:Colors.warning},
  summaryCard:{borderWidth:1,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:Colors.surface,gap:4},
  summaryRow:{flexDirection:'row',justifyContent:'space-between'},
  summaryLabel:{fontSize:13,fontWeight:'600',color:Colors.text},
  summaryCount:{fontSize:14,fontWeight:'700'},
  summaryDetail:{fontSize:11,color:Colors.textMuted},
  sectionTitle:{fontSize:14,fontWeight:'600',color:Colors.text,marginBottom:6},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline',marginBottom:6},
  counter:{fontSize:12},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:Colors.border,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:Colors.surface,marginBottom:6},
  cardName:{fontSize:13,color:Colors.text},cardSub:{fontSize:11,color:Colors.textMuted},
  lockedBadge:{borderWidth:1,borderColor:Colors.borderStrong,borderRadius:4,paddingHorizontal:6,paddingVertical:2},
  lockedTxt:{fontSize:10,color:Colors.textMuted},
  emptyHint:{fontSize:12,color:Colors.textMuted},
  aspectSelector:{borderWidth:1,borderColor:Colors.border,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:Colors.surface,gap:8},
  aspectSelectorHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  aspectLocked:{fontSize:10,color:Colors.warning,flex:1,textAlign:'right'},
  specialNote:{backgroundColor:Colors.warningBg,borderWidth:1,borderColor:Colors.warning+'44',borderRadius:Radius.sm,padding:Spacing.sm},
  specialNoteTxt:{fontSize:11,color:Colors.warning},
  pillRow:{flexDirection:'row',flexWrap:'wrap',gap:6},
  searchInput:{backgroundColor:Colors.surface,borderWidth:1,borderColor:Colors.border,borderRadius:Radius.sm,color:Colors.text,fontSize:13,paddingVertical:7,paddingHorizontal:10,marginBottom:6},
  chip:{paddingVertical:4,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:Colors.border},
  chipActive:{backgroundColor:Colors.surface2,borderColor:Colors.text},
  chipTxt:{fontSize:12,color:Colors.textMuted},chipTxtActive:{color:Colors.text},
  poolHint:{fontSize:11,color:Colors.textMuted,marginBottom:6},
  smallBtn:{paddingVertical:7,paddingHorizontal:14,borderRadius:Radius.md,borderWidth:1,borderColor:Colors.borderStrong,backgroundColor:Colors.surface,alignSelf:'flex-start'},
  smallBtnTxt:{fontSize:12,color:Colors.text},
  exportBtn:{borderWidth:1,borderColor:Colors.borderStrong,borderRadius:Radius.md,padding:12,alignItems:'center',backgroundColor:Colors.surface,marginTop:8},
  exportTxt:{fontSize:13,color:Colors.text},
});

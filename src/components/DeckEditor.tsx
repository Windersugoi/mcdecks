import React, { useState, useMemo, useRef, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, StyleSheet, Switch, Alert, Share, Image } from 'react-native';
import { Deck, Card, OwnedSets } from '@/data/types';
import { ASPECT_CARDS, HERO_CARDS, NEMESIS_CARDS, SET_CATALOG } from '@/data/cards';
import { ASPECT_LIST, MULTI_ASPECT_HEROES, displayAspect, DECK_MIN, DECK_MAX, HERO_SETS_BY_CYCLE, HERO_TO_SET, COMING_SOON_HEROES } from '@/data/constants';
import { aspectColor, deckTitleColor, usedElsewhere } from '@/utils/deckUtils';
import { Colors, Radius, Spacing } from '@/styles/theme';
import { useColors } from '@/hooks/useColors';
import { Pill } from './Pill';
import { DeckCardRow } from './DeckCardRow';
import { PoolCardRow } from './PoolCardRow';
import { CardPreviewModal } from './CardPreviewModal';
import { notify, openExternal } from '@/utils/dialogs';

// Sets aún no publicados. Se excluyen siempre del pool, aunque una colección
// guardada antigua los tenga marcados como poseídos (p. ej. por un "Marcar todo"
// anterior a que se bloquearan, que Android puede restaurar al reinstalar).
const COMING_SOON_SETS = new Set(
  SET_CATALOG.filter(s => s.comingSoon).map(s => s.code)
);

interface Props {
  decks: Deck[]; setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  deckId: string; onBack: () => void;
  ownedSets: OwnedSets; showAll: boolean;
}

// Carta pequeña en miniatura para el modo rejilla (estilo Marvel Snap: solo
// la imagen, con un contador de cantidad si hay más de 1). Tocarla abre la
// misma ficha grande que ya se usa en el modo lista.
// Proporción real de una carta de Marvel Champions (ancho:alto ≈ 0.72)
const CARD_RATIO = 128 / 92;

function GridCard({ card, qty, style, size, onPress }: { card: Card; qty?: number; style: any; size: number; onPress: () => void }) {
  const dims = { width: size, height: Math.round(size * CARD_RATIO) };
  return (
    <Pressable onPress={onPress} style={[style.gridCard, dims]}>
      {card.imgsrc
        ? <Image source={{ uri: card.imgsrc }} style={style.gridCardImg} resizeMode="cover" />
        : (
          <View style={[style.gridCardImg, style.gridCardImgPlaceholder]}>
            <Text style={style.gridCardPlaceholderTxt} numberOfLines={4}>{card.name}</Text>
          </View>
        )}
      {!!qty && qty > 1 && (
        <View style={style.gridCardQtyBadge}><Text style={style.gridCardQtyTxt}>×{qty}</Text></View>
      )}
    </Pressable>
  );
}

export function DeckEditor({ decks, setDecks, deckId, onBack, ownedSets, showAll }: Props) {
  const deck = decks.find(d => d.id === deckId);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'name'|'aspect'>('name');
  const [localShowAll, setLocalShowAll] = useState(showAll);
  const [gridMode, setGridMode] = useState(false);
  const [gridModePool, setGridModePool] = useState(false);
  const [gridCardSize, setGridCardSize] = useState(92);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(deck?.name ?? '');
  const [showNemesis, setShowNemesis] = useState(false);
  const [heroSearch, setHeroSearch] = useState('');
  const [previewCard, setPreviewCard] = useState<Card | null>(null);
  const [importUrl, setImportUrl] = useState('');
  const C = useColors();
  const s = useMemo(() => getStyles(C), [C]);
  const scrollRef = useRef<ScrollView>(null);

  // Al elegir héroe (mazo nuevo), la pantalla cambia de "elegir héroe" al editor completo.
  // React reutiliza la misma instancia de ScrollView, así que sin esto se conserva el
  // scroll donde estaba en el selector, en vez de empezar arriba del todo.
  useEffect(() => {
    if (deck?.hero) {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [deck?.hero]);

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

  const MAIN_ASPECTS = ['Aggression', 'Justice', 'Leadership', 'Protection'] as const;

  // Cuenta cartas de cada aspecto principal en el mazo actual
  const aspectBalance = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const asp of MAIN_ASPECTS) {
      counts[asp] = Object.entries(deck.cards).reduce((sum, [cid, qty]) => {
        const c = ASPECT_CARDS.find(x => x.id === cid);
        return c?.aspect === asp ? sum + qty : sum;
      }, 0);
    }
    return counts;
  }, [deck.cards]);

  function changeQty(cardId: string, delta: number) {
    const current = deck.cards[cardId] ?? 0;
    const card = ASPECT_CARDS.find(c => c.id === cardId);
    // Adam Warlock: máximo 1 copia de cada carta
    const hardMax = heroRule?.maxCopies ?? (card?.maxPerDeck ?? 4);

    if (delta > 0 && heroRule?.rule === 'all4' && card?.aspect &&
        MAIN_ASPECTS.includes(card.aspect as typeof MAIN_ASPECTS[number])) {
      // Calcular balance DESPUÉS de añadir esta carta
      const newCount = (aspectBalance[card.aspect] ?? 0) + 1;
      const otherCounts = MAIN_ASPECTS
        .filter(a => a !== card.aspect)
        .map(a => aspectBalance[a] ?? 0);
      const minOther = Math.min(...otherCounts);
      // Solo permitir si este aspecto no va a quedar por encima de todos los demás
      if (newCount > minOther + 1) {
        const behind = MAIN_ASPECTS.filter(a => a !== card.aspect && (aspectBalance[a] ?? 0) < newCount - 1);
        notify(
          'Adam Warlock — Balance requerido',
          `Los aspectos deben tener el mismo número de cartas.\nPrimero añade cartas de: ${behind.join(', ')}.`
        );
        return;
      }
    }

    const next = Math.min(hardMax, Math.max(0, current + delta));
    const cards = { ...deck.cards };
    if (next === 0) delete cards[cardId]; else cards[cardId] = next;
    update({ cards });
  }

  // Nombres de mazos físicos (ajenos a este) que tienen comprometida esta
  // carta. Usa el mismo criterio nombre+aspecto que effectiveOwned, para
  // detectar copias de otros sets de la misma carta correctamente.
  function physicalHolders(card: Card): string[] {
    return decks
      .filter(d => d.id !== deckId && d.physical)
      .filter(d => ASPECT_CARDS
        .filter(c => c.name === card.name && c.aspect === card.aspect)
        .some(c => (d.cards[c.id] ?? 0) > 0))
      .map(d => d.name);
  }

  // Compute effective owned based on collection
  // Suma copias de TODOS los sets poseídos que incluyen esta carta.
  // Descuenta las copias usadas en mazos marcados como "físicos" (physical=true).
  function effectiveOwned(card: Card): number {
    if (localShowAll) return 99;
    const totalOwned = ASPECT_CARDS
      .filter(c => c.name === card.name && c.aspect === card.aspect)
      .reduce((sum, c) => sum + ((!c.setCode || ownedSets[c.setCode]) ? (c.qty ?? 1) : 0), 0);
    // La escasez por "ya reclamada en otro mazo físico" solo importa si ESTE
    // mazo TAMBIÉN es físico — un mazo en borrador nunca debería bloquearse
    // por otro mazo físico; el aviso informativo de "también en uso" (más
    // abajo, en DeckCardRow/PoolCardRow) ya avisa sin bloquear. El propio
    // pin de marcar-como-físico es quien impide el conflicto real.
    if (!deck.physical) return totalOwned;
    const usedByPhysical = decks
      .filter(d => d.id !== deckId && d.physical)
      .reduce((total, d) => {
        const used = ASPECT_CARDS
          .filter(c => c.name === card.name && c.aspect === card.aspect)
          .reduce((s, c) => s + (d.cards[c.id] ?? 0), 0);
        return total + used;
      }, 0);
    return Math.max(0, totalOwned - usedByPhysical);
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
  // isIdentity también cubre cartas de forma alternativa que no son Hero/Alter-Ego
  // en sí — deben ir con la identidad, no contar para el 40.
  const identityCards = mandatory.filter(c => c.type === 'Hero' || c.type === 'Alter-Ego' || c.isIdentity);
  // qty:0 = "cara reverso" de una carta de doble cara (p. ej. Dense de Vision,
  // Phased de Shadowcat): la cara frontal ya cuenta por las dos, el reverso no
  // se lista aparte para no duplicar la carta visualmente ni en el recuento.
  const deckMandatory = mandatory.filter(c => c.type !== 'Hero' && c.type !== 'Alter-Ego' && !c.isIdentity && c.qty !== 0);
  const mandCount = deckMandatory.reduce((a, c) => a + (c.permanent ? 0 : (c.qty ?? 1)), 0);
  const optCount  = Object.values(deck.cards).reduce((a, q) => a + q, 0);
  const total     = mandCount + optCount;
  const deckFull  = total >= DECK_MAX;
  const deckReady = total >= DECK_MIN;
  const countColor = deckFull ? C.danger : deckReady ? C.success : C.warning;

  const poolCards = useMemo(() => {
    const filtered = ASPECT_CARDS.filter(c => {
      if (deck.cards[c.id]) return false;
      // Sets sin publicar: nunca aparecen, ni siquiera con "All cards"
      if (c.setCode && COMING_SOON_SETS.has(c.setCode)) return false;
      // Collection filter
      const inCollection = c.setCode ? !!ownedSets[c.setCode] : true;
      if (!localShowAll && !inCollection) return false;
      // Aspect filter
      const basicSelected = deck.aspects.includes('Basic');
      if (heroRule?.rule === 'all4') {
        // Adam Warlock: los 4 aspectos siempre visibles; Basic si seleccionado; nunca Pool
        if (c.aspect === 'Pool') return false;
        if (c.aspect === 'Basic' && !basicSelected) return false;
      } else {
        // Para dual (ej: Spider-Woman): mostrar TODOS los aspectos seleccionados
        // Para héroes normales: usar activeAspect (único aspecto o detectado de las cartas)
        const mainAspects = heroRule?.rule === 'dual'
          ? deck.aspects.filter(a => a !== 'Basic')
          : (activeAspect ? [activeAspect] : []);
        const basicOnly = basicSelected && mainAspects.length === 0;
        if (basicOnly) {
          if (c.aspect !== 'Basic') return false;
        } else if (mainAspects.length > 0) {
          if (c.aspect === 'Basic') {
            if (!basicSelected) return false;
          } else if (!mainAspects.includes(c.aspect)) {
            return false;
          }
        }
      }
      // Sin aspecto activo y sin Basic solo = mostrar todo
      const q = search.toLowerCase();
      if (q && !c.name.toLowerCase().includes(q)) return false;
      // Los tipos llevan prefijo de aspecto/héroe ('JusticeAlly', 'BishopUpgrade'),
      // así que el chip debe compararse por sufijo, no por igualdad exacta.
      if (typeFilter !== 'All' && !(c.type ?? '').endsWith(typeFilter)) return false;
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
    const hq = heroSearch.toLowerCase();
    return (
      <ScrollView style={s.scroll} contentContainerStyle={s.container}>
        <Pressable onPress={onBack} style={s.backBtn}><Text style={s.backTxt}>← Decks</Text></Pressable>
        <Text style={s.heroTitle}>Choose your hero</Text>
        <Text style={s.sub}>Hero cards and nemesis set are added automatically.</Text>
        <TextInput
          placeholder="Search hero..."
          placeholderTextColor={C.textMuted}
          value={heroSearch}
          onChangeText={setHeroSearch}
          style={s.heroSearchInput}
        />
        {Object.entries(HERO_SETS_BY_CYCLE).map(([cycle, heroes]) => {
          const filtered = heroes.filter(h => !hq || h.toLowerCase().includes(hq));
          if (filtered.length === 0) return null;
          return (
            <View key={cycle}>
              <Text style={s.cycleLabel}>{cycle}</Text>
              {filtered.map(h => {
                const hCode = HERO_TO_SET[h];
                const owned = localShowAll || !hCode || !!ownedSets[hCode] || COMING_SOON_HEROES.has(h);
                const setName = hCode ? (SET_CATALOG.find(x => x.code === hCode)?.name ?? hCode) : null;
                const isSoon = COMING_SOON_HEROES.has(h);
                const canSelect = owned && !isSoon;
                return (
                  <Pressable key={h}
                    onPress={() => { if (!canSelect) return; update({ hero: h }); setNameDraft(h); }}
                    style={[s.heroRow, !owned && !isSoon && s.heroRowMissing, isSoon && s.heroRowSoon]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.heroName, !owned && !isSoon && { color: C.textMuted }]}>{h}</Text>
                      {isSoon
                        ? <Text style={s.soonLabel}>★ Coming Soon — cards not yet on marvelcdb</Text>
                        : (!owned && setName && <Text style={s.missingSet}>⚠ Missing: {setName}</Text>)
                      }
                    </View>
                    {MULTI_ASPECT_HEROES[h] && <Text style={s.specialBadge}>Special</Text>}
                    <Text style={{ color: C.textMuted, marginLeft: 8 }}>{canSelect ? '→' : '🔒'}</Text>
                  </Pressable>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
    <ScrollView ref={scrollRef} style={s.scroll} contentContainerStyle={s.container}>
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

      <Pressable style={s.gridToggleRow} onPress={() => setGridMode(v => !v)}>
        <Text style={s.gridToggleLabel}>🎴 Ver cartas del mazo en imágenes</Text>
        <Switch value={gridMode} onValueChange={setGridMode}
          trackColor={{ false: C.border, true: C.success }}
          thumbColor={gridMode ? C.text : C.textMuted} />
      </Pressable>

      {(gridMode || gridModePool) && (
        <View style={s.sizeRow}>
          <Text style={s.sizeLabel}>Tamaño de las cartas</Text>
          <View style={s.sizeBtns}>
            <Pressable style={s.sizeBtn} onPress={() => setGridCardSize(v => Math.max(56, v - 12))}>
              <Text style={s.sizeBtnTxt}>−</Text>
            </Pressable>
            <Pressable style={s.sizeBtn} onPress={() => setGridCardSize(v => Math.min(160, v + 12))}>
              <Text style={s.sizeBtnTxt}>+</Text>
            </Pressable>
          </View>
        </View>
      )}

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

      {gridMode ? (
        <View>
          {/* Identity cards */}
          {identityCards.length > 0 && (
            <View style={{ marginBottom: 12 }}>
              <Text style={s.sectionTitle}>Identity — {deck.hero}</Text>
              <View style={s.gridRow}>
                {identityCards.map(card => (
                  <GridCard key={card.id} card={card} style={s} size={gridCardSize} onPress={() => setPreviewCard(card)} />
                ))}
              </View>
            </View>
          )}

          {/* Mandatory deck cards */}
          <View style={{ marginBottom: 12 }}>
            <Text style={s.sectionTitle}>{deck.hero} deck cards ({mandCount})</Text>
            <View style={s.gridRow}>
              {deckMandatory.map(card => (
                <GridCard key={card.id} card={card} qty={card.qty} style={s} size={gridCardSize} onPress={() => setPreviewCard(card)} />
              ))}
            </View>
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
            <View style={s.gridRow}>
              {Object.entries(deck.cards).map(([cardId, qty]) => {
                const card = ASPECT_CARDS.find(c => c.id === cardId);
                if (!card) return null;
                return <GridCard key={cardId} card={card} qty={qty} style={s} size={gridCardSize} onPress={() => setPreviewCard(card)} />;
              })}
            </View>
          </View>

          {/* Nemesis — se ven directamente al activar la rejilla, sin botón aparte */}
          {nemesis.length > 0 && (
            <View style={{ marginTop: 12 }}>
              <Text style={s.sectionTitle}>{deck.hero} nemesis</Text>
              <View style={s.gridRow}>
                {nemesis.map(card => (
                  <GridCard key={card.id} card={card} qty={card.qty} style={s} size={gridCardSize} onPress={() => setPreviewCard(card)} />
                ))}
              </View>
            </View>
          )}
        </View>
      ) : (
        <View>
          {/* Identity cards */}
          {identityCards.length > 0 && (
            <View>
              <Text style={s.sectionTitle}>Identity — {deck.hero}</Text>
              {identityCards.map(card => (
                <Pressable key={card.id} onPress={() => setPreviewCard(card)}
                  style={[s.row, { opacity: 0.75, borderColor: C.info + '44' }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.cardName}>{card.name}</Text>
                    <Text style={s.cardSub}>{card.type} · Set aside</Text>
                  </View>
                  <View style={[s.lockedBadge, { borderColor: C.info + '66' }]}>
                    <Text style={[s.lockedTxt, { color: C.info }]}>Identity</Text>
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
                  physicalHold={physicalHolders(card)}
                  setName={!localShowAll && card.setCode && !ownedSets[card.setCode]
                    ? (SET_CATALOG.find(s => s.code === card.setCode)?.name ?? card.setCode)
                    : undefined}
                  onChange={d => changeQty(cardId, d)} onPreview={setPreviewCard} />
              );
            })}
          </View>
        </View>
      )}

      {/* Nemesis — justo tras las cartas del mazo, antes del toggle del pool */}
      <Pressable onPress={() => setShowNemesis(v => !v)} style={s.smallBtn}>
        <Text style={s.smallBtnTxt}>{showNemesis ? 'Hide' : 'Show'} {deck.hero} nemesis</Text>
      </Pressable>
      {showNemesis && nemesis.map(c => (
        <View key={c.id} style={[s.row, { opacity: 0.6 }]}>
          <Text style={s.cardName}>{c.qty ?? 1}x {c.name}</Text>
          <Text style={s.cardSub}>{c.type}</Text>
        </View>
      ))}

      {/* Toggle de vista en rejilla para el pool de abajo (todas las cartas) */}
      <Pressable style={s.gridToggleRow} onPress={() => setGridModePool(v => !v)}>
        <Text style={s.gridToggleLabel}>🎴 Ver todas las cartas en imágenes</Text>
        <Switch value={gridModePool} onValueChange={setGridModePool}
          trackColor={{ false: C.border, true: C.success }}
          thumbColor={gridModePool ? C.text : C.textMuted} />
      </Pressable>

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
            const color = a === 'Pool' ? '#CC6699' : a === 'Basic' ? C.textMuted : aspectColor(a);
            return (
              <Pill key={a} color={color} active={active} locked={locked}
                onPress={() => !locked && toggleAspect(a)}>
                {a}{a === 'Pool' && !deadpoolOwned ? ' 🔒' : ''}
              </Pill>
            );
          })}
          {!isMulti && !detectedAspect && deck.aspects.filter(a => a !== 'Basic').length === 0 && (
            <Pill color={C.info} active={true} onPress={() => {}}>All aspects</Pill>
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
        <TextInput placeholder="Search..." placeholderTextColor={C.textMuted}
          value={search} onChangeText={setSearch} style={s.searchInput} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {['All','Ally','Event','Support','Upgrade','Resource','Scheme'].map(t => (
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
            style={[s.chip, localShowAll && { borderColor: C.warning }]}>
            <Text style={[s.chipTxt, localShowAll && { color: C.warning }]}>
              {localShowAll ? 'All cards' : 'My collection'}
            </Text>
          </Pressable>
        </View>
        {heroRule?.rule === 'all4' ? (
          <View style={s.balanceRow}>
            {MAIN_ASPECTS.map(a => {
              const count = aspectBalance[a] ?? 0;
              const counts = MAIN_ASPECTS.map(x => aspectBalance[x] ?? 0);
              const maxCount = Math.max(...counts);
              const ok = count === maxCount || count === maxCount - 1;
              return (
                <View key={a} style={[s.balanceChip, ok ? s.balanceOk : s.balanceBad]}>
                  <Text style={[s.balanceTxt, !ok && { color: C.danger }]}>
                    {a.slice(0,3)} {count}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={s.poolHint}>
            {activeAspect ? `${activeAspect} + Basic` : 'All aspects + Basic'}
            {!localShowAll ? ' · My collection' : ''}
          </Text>
        )}
        {gridModePool ? (
          <View style={s.gridRow}>
            {poolCards.map(card => (
              <GridCard key={card.id} card={card} style={s} size={gridCardSize} onPress={() => setPreviewCard(card)} />
            ))}
          </View>
        ) : (
          poolCards.map(card => (
            <PoolCardRow key={card.id} card={{ ...card, owned: effectiveOwned(card) }}
              decks={decks} deckId={deckId} deckFull={deckFull}
              physicalHold={physicalHolders(card)}
              onAdd={() => changeQty(card.id, 1)} onPreview={setPreviewCard} />
          ))
        )}
        {poolCards.length === 0 && (
          <Text style={s.emptyHint}>
            {!localShowAll ? 'No cards in collection. Tap "My collection" to see all.' : 'No cards match.'}
          </Text>
        )}
      </View>

      <Pressable style={s.exportBtn}><Text style={s.exportTxt}>⤒ Export to marvelcdb</Text></Pressable>

      <Pressable style={s.shareBtn} onPress={() => {
        if (!deck.hero) return;
        const heroCards = (HERO_CARDS[deck.hero] ?? [])
          .filter(c => c.type !== 'Hero' && c.type !== 'Alter-Ego')
          .map(c => `  · ${c.qty ?? 1}× ${c.name}`).join('\n');
        const aspectCards = Object.entries(deck.cards)
          .map(([id, qty]) => {
            const card = ASPECT_CARDS.find(c => c.id === id);
            return card ? `  · ${qty}× ${card.name}` : null;
          }).filter(Boolean).join('\n');
        const aspects = deck.aspects.filter(a => a !== 'Basic').join(' + ');
        const text = [
          `🃏 MCDecks — ${deck.hero} (${aspects || 'No aspect'})`,
          `${'─'.repeat(40)}`,
          `HERO (${mandCount} cards)`,
          heroCards,
          ``,
          `DECK (${optCount} cards)`,
          aspectCards || '  (empty)',
          ``,
          `Total: ${total}/${DECK_MAX} cards`,
        ].join('\n');
        Share.share({ message: text, title: deck.name });
      }}>
        <Text style={s.shareTxt}>⇪ Share deck list</Text>
      </Pressable>

      {deck.importSource && (
        <Pressable style={s.linkBtn} onPress={() => openExternal(deck.importSource!)}>
          <Text style={s.linkTxt}>🔗 View on marvelcdb</Text>
        </Pressable>
      )}
    </ScrollView>

      <View style={s.scrollFabCol} pointerEvents="box-none">
        <Pressable style={s.scrollFab} onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}>
          <Text style={s.scrollFabTxt}>▲</Text>
        </Pressable>
        <Pressable style={s.scrollFab} onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          <Text style={s.scrollFabTxt}>▼</Text>
        </Pressable>
      </View>
      <Pressable style={s.backFab} onPress={onBack} hitSlop={8}>
        <Text style={s.backFabTxt}>← Decks</Text>
      </Pressable>
    </View>
  );
}

function getStyles(C: typeof import("@/styles/theme").DarkColors) {
  return StyleSheet.create({
  scroll:{flex:1,backgroundColor:C.bg},
  container:{padding:Spacing.lg,gap:14,paddingBottom:40},
  backBtn:{alignSelf:'flex-start'},backTxt:{color:C.textSub,fontSize:13},
  deckTitle:{fontSize:19,fontWeight:'700',borderBottomWidth:2},
  heroTitle:{fontSize:18,fontWeight:'600',color:C.text},
  sub:{fontSize:12,color:C.textMuted},
  heroRow:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:C.border,borderRadius:Radius.md,padding:10,backgroundColor:C.surface,marginBottom:5},
  heroRowMissing:{borderColor:C.warning+'44',backgroundColor:C.warningBg},
  heroName:{fontSize:14,fontWeight:'600',color:C.text},
  cycleLabel:{fontSize:11,color:C.textMuted,fontWeight:'700',marginBottom:4,marginTop:8,textTransform:'uppercase',letterSpacing:0.5},
  specialBadge:{fontSize:10,color:C.warning,borderWidth:1,borderColor:C.warning,borderRadius:4,paddingHorizontal:5,paddingVertical:2},
  heroRowSoon:{borderColor:C.info+'44',backgroundColor:C.surface2},
  soonLabel:{fontSize:11,color:C.info,marginTop:1},
  missingSet:{fontSize:11,color:C.warning},
  summaryCard:{borderWidth:1,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:C.surface,gap:4},
  summaryRow:{flexDirection:'row',justifyContent:'space-between'},
  summaryLabel:{fontSize:13,fontWeight:'600',color:C.text},
  summaryCount:{fontSize:14,fontWeight:'700'},
  summaryDetail:{fontSize:11,color:C.textMuted},
  sectionTitle:{fontSize:14,fontWeight:'600',color:C.text,marginBottom:6},
  sectionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'baseline',marginBottom:6},
  counter:{fontSize:12},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:C.border,borderRadius:Radius.md,padding:Spacing.sm,backgroundColor:C.surface,marginBottom:6},
  cardName:{fontSize:13,color:C.text},cardSub:{fontSize:11,color:C.textMuted},
  lockedBadge:{borderWidth:1,borderColor:C.borderStrong,borderRadius:4,paddingHorizontal:6,paddingVertical:2},
  lockedTxt:{fontSize:10,color:C.textMuted},
  emptyHint:{fontSize:12,color:C.textMuted},
  aspectSelector:{borderWidth:1,borderColor:C.border,borderRadius:Radius.lg,padding:Spacing.md,backgroundColor:C.surface,gap:8},
  gridToggleRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
                 borderWidth:1,borderColor:C.border,borderRadius:Radius.md,
                 paddingVertical:9,paddingHorizontal:12,backgroundColor:C.surface},
  gridToggleLabel:{fontSize:13,color:C.text,fontWeight:'600'},
  sizeRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',
           paddingVertical:6,paddingHorizontal:2},
  sizeLabel:{fontSize:12,color:C.textMuted},
  sizeBtns:{flexDirection:'row',gap:8},
  sizeBtn:{width:32,height:32,borderRadius:16,borderWidth:1,borderColor:C.borderStrong,
           backgroundColor:C.surface2,alignItems:'center',justifyContent:'center'},
  sizeBtnTxt:{fontSize:16,color:C.text,fontWeight:'700'},
  gridRow:{flexDirection:'row',flexWrap:'wrap',gap:8},
  gridCard:{borderRadius:8,overflow:'hidden',backgroundColor:C.surface2,
            borderWidth:1,borderColor:C.border},
  gridCardImg:{width:'100%',height:'100%'},
  gridCardImgPlaceholder:{alignItems:'center',justifyContent:'center',padding:4},
  gridCardPlaceholderTxt:{fontSize:9,color:C.textMuted,textAlign:'center'},
  gridCardQtyBadge:{position:'absolute',right:2,bottom:2,backgroundColor:'#000000cc',
                    borderRadius:8,minWidth:16,paddingHorizontal:3,paddingVertical:1,alignItems:'center'},
  gridCardQtyTxt:{fontSize:10,color:'#fff',fontWeight:'700'},
  aspectSelectorHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  aspectLocked:{fontSize:10,color:C.warning,flex:1,textAlign:'right'},
  specialNote:{backgroundColor:C.warningBg,borderWidth:1,borderColor:C.warning+'44',borderRadius:Radius.sm,padding:Spacing.sm},
  specialNoteTxt:{fontSize:11,color:C.warning},
  balanceRow:{flexDirection:'row',gap:6,marginBottom:6},
  balanceChip:{flex:1,alignItems:'center',paddingVertical:4,borderRadius:Radius.sm,borderWidth:1,borderColor:C.border,backgroundColor:C.surface2},
  balanceOk:{borderColor:C.success+'66'},
  balanceBad:{borderColor:C.danger,backgroundColor:C.dangerBg},
  balanceTxt:{fontSize:11,fontWeight:'600',color:C.text},
  pillRow:{flexDirection:'row',flexWrap:'wrap',gap:6},
  searchInput:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:Radius.sm,color:C.text,fontSize:13,paddingVertical:7,paddingHorizontal:10,marginBottom:6},
  chip:{paddingVertical:4,paddingHorizontal:10,borderRadius:999,borderWidth:1,borderColor:C.border},
  chipActive:{backgroundColor:C.surface2,borderColor:C.text},
  chipTxt:{fontSize:12,color:C.textMuted},chipTxtActive:{color:C.text},
  poolHint:{fontSize:11,color:C.textMuted,marginBottom:6},
  smallBtn:{paddingVertical:7,paddingHorizontal:14,borderRadius:Radius.md,borderWidth:1,borderColor:C.borderStrong,backgroundColor:C.surface,alignSelf:'flex-start'},
  smallBtnTxt:{fontSize:12,color:C.text},
  exportBtn:{borderWidth:1,borderColor:C.borderStrong,borderRadius:Radius.md,padding:12,alignItems:'center',backgroundColor:C.surface,marginTop:8},
  exportTxt:{fontSize:13,color:C.text},
  shareBtn:{borderWidth:1,borderColor:C.info+'66',borderRadius:Radius.md,padding:12,alignItems:'center',backgroundColor:C.info+'11',marginTop:6},
  shareTxt:{fontSize:13,color:C.info,fontWeight:'600'},
  linkBtn:{borderWidth:1,borderColor:C.borderStrong,borderRadius:Radius.md,padding:12,alignItems:'center',backgroundColor:C.surface,marginTop:6},
  linkTxt:{fontSize:13,color:C.textSub,fontWeight:'600'},
  heroSearchInput:{backgroundColor:C.surface,borderWidth:1,borderColor:C.border,borderRadius:Radius.md,color:C.text,fontSize:14,paddingVertical:9,paddingHorizontal:12,marginBottom:6},
  scrollFabCol:{position:'absolute',right:14,bottom:18,gap:10},
  scrollFab:{width:44,height:44,borderRadius:22,backgroundColor:C.surface2,borderWidth:1,borderColor:C.borderStrong,alignItems:'center',justifyContent:'center',shadowColor:'#000',shadowOpacity:0.3,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:4},
  scrollFabTxt:{fontSize:16,color:C.text,fontWeight:'700'},
  backFab:{position:'absolute',left:14,top:14,paddingVertical:9,paddingHorizontal:14,borderRadius:20,backgroundColor:C.surface2,borderWidth:1,borderColor:C.borderStrong,shadowColor:'#000',shadowOpacity:0.3,shadowRadius:4,shadowOffset:{width:0,height:2},elevation:4},
  backFabTxt:{fontSize:13,color:C.text,fontWeight:'700'},
});
}

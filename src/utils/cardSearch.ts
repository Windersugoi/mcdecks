import { Card, Deck } from '@/data/types';
import { ASPECT_CARDS, HERO_CARDS } from '@/data/cards';

// Índice combinado id -> Card. ASPECT_CARDS tiene VARIAS entradas con el mismo
// nombre (una por cada set en el que se reimprime esa carta, ej. "The Power of
// Justice" viene en el Core y en 5 packs de héroe más, cada copia con su propio
// id). HERO_CARDS aporta además aliados específicos de héroe que otros mazos
// pueden usar vía efectos como "Make the Call". Sin este índice no se puede
// pasar de un id guardado en deck.cards a su nombre real.
const ALL_CARDS_BY_ID: Record<string, Card> = {};
for (const c of ASPECT_CARDS) ALL_CARDS_BY_ID[c.id] = c;
for (const list of Object.values(HERO_CARDS)) {
  for (const c of list) {
    if (!ALL_CARDS_BY_ID[c.id]) ALL_CARDS_BY_ID[c.id] = c;
  }
}

export interface SearchableCard {
  key: string;      // name||aspect — agrupa todas las reimpresiones de la misma carta
  name: string;
  aspect?: string;
  imgsrc?: string;
  ids: string[];
}

// Cartas únicas por nombre+aspecto para el autocompletado. Se excluyen las
// cartas de identidad (Hero/Alter-Ego): buscar "Spider-Man" como carta no
// tiene sentido de búsqueda (esa carta nunca vive en deck.cards) y solo
// generaría resultados confusos.
export const SEARCHABLE_CARDS: SearchableCard[] = (() => {
  const map = new Map<string, SearchableCard>();
  for (const c of Object.values(ALL_CARDS_BY_ID)) {
    if (c.isIdentity) continue;
    const key = `${c.name}||${c.aspect ?? ''}`;
    const existing = map.get(key);
    if (existing) {
      existing.ids.push(c.id);
      if (!existing.imgsrc && c.imgsrc) existing.imgsrc = c.imgsrc;
    } else {
      map.set(key, { key, name: c.name, aspect: c.aspect, imgsrc: c.imgsrc, ids: [c.id] });
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
})();

/** Sugerencias de autocompletado: primero nombres que EMPIEZAN por la búsqueda, luego los que la contienen. */
export function suggestCards(query: string, limit = 6): SearchableCard[] {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const starts: SearchableCard[] = [];
  const contains: SearchableCard[] = [];
  for (const c of SEARCHABLE_CARDS) {
    const n = c.name.toLowerCase();
    if (n.startsWith(q)) starts.push(c);
    else if (n.includes(q)) contains.push(c);
  }
  return [...starts, ...contains].slice(0, limit);
}

export interface DeckCardMatch { name: string; aspect?: string; qty: number; mandatory?: boolean; }

/**
 * Para un mazo y un texto de búsqueda, devuelve las cartas del mazo cuyo
 * nombre coincide (y la cantidad). Busca tanto en las cartas elegidas por el
 * jugador (deck.cards) como en las obligatorias del héroe (vienen siempre,
 * no se guardan en deck.cards) — así una búsqueda por una carta propia de un
 * héroe también encuentra los mazos de ese héroe.
 */
export function matchDeckByQuery(deck: Deck, query: string): DeckCardMatch[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const byKey = new Map<string, DeckCardMatch>();

  for (const [id, qty] of Object.entries(deck.cards)) {
    const card = ALL_CARDS_BY_ID[id];
    if (!card || !card.name.toLowerCase().includes(q)) continue;
    const key = `${card.name}||${card.aspect ?? ''}`;
    const existing = byKey.get(key);
    if (existing) existing.qty += qty;
    else byKey.set(key, { name: card.name, aspect: card.aspect, qty });
  }

  const mandatory = (HERO_CARDS[deck.hero ?? ''] ?? []).filter(c => !c.isIdentity);
  for (const c of mandatory) {
    if (!c.name.toLowerCase().includes(q)) continue;
    const key = `${c.name}||${c.aspect ?? ''}`;
    if (!byKey.has(key)) byKey.set(key, { name: c.name, aspect: c.aspect, qty: c.qty ?? 1, mandatory: true });
  }

  return [...byKey.values()];
}

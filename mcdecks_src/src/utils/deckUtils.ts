import { Deck, Card } from '@/data/types';
import { Colors } from '@/styles/theme';

export function aspectColor(a: string): string {
  return Colors.aspects[a] ?? Colors.textMuted;
}
export function deckTitleColor(deck: Deck): string {
  if (!deck.aspects?.length) return Colors.textMuted;
  if (deck.aspects.length > 1) return Colors.textSub;
  return aspectColor(deck.aspects[0]);
}
export interface UsageInfo { deckName: string; hero: string | null; qty: number; }
export function usedElsewhere(decks: Deck[], cardId: string, excludeId: string): UsageInfo[] {
  return decks.filter(d => d.id !== excludeId)
    .flatMap(d => d.cards[cardId] ? [{ deckName: d.name, hero: d.hero, qty: d.cards[cardId] }] : []);
}
export function availableCopies(decks: Deck[], card: Card, excludeId: string): number {
  const used = usedElsewhere(decks, card.id, excludeId).reduce((a, u) => a + u.qty, 0);
  return Math.max(0, card.owned - used);
}
export function isDeckValid(decks: Deck[], deck: Deck, cardPool: Card[]): boolean {
  for (const [cardId, qty] of Object.entries(deck.cards)) {
    const card = cardPool.find(c => c.id === cardId);
    if (!card) continue;
    if (availableCopies(decks, card, deck.id) < qty) return false;
  }
  return true;
}

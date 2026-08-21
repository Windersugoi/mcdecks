export interface Card {
  id: string;
  name: string;
  type: string;
  cost: number | null;
  qty?: number;
  owned: number;
  aspect?: string;
  setCode?: string;
  maxPerDeck?: number;
  isIdentity?: boolean;
  imgsrc?: string;
}

export interface DeckCards { [cardId: string]: number; }
export interface VillainProgress { defeated: boolean; modular: string[]; }
export interface CampaignProgress { completed: boolean; entriesCompleted: { [villain: string]: boolean }; }
export interface Deck {
  id: string; name: string; hero: string | null; aspects: string[];
  cards: DeckCards;
  physical?: boolean; // true = estas cartas están físicamente en este mazo
  importSource?: string; // URL de marvelcdb si este mazo se importó de ahí
  villains: { [villain: string]: VillainProgress };
  campaigns: { [campaignId: string]: CampaignProgress };
}
export interface CampaignEntry { villain: string; stages?: string; modular: string[]; }
export interface Campaign {
  id: string; name: string; source: string; mode?: string;
  entries: CampaignEntry[]; rating?: number; votes?: number; author?: string;
}
export interface HeroRule {
  rule: 'dual' | 'all4'; exactAspects: number; maxCopies: number; note: string;
}
export interface SetInfo {
  code: string; name: string; nameEs: string; cycle: string;
  type: 'box' | 'hero' | 'scenario' | 'campaign' | 'module'; totalCards: number;
  comingSoon?: boolean;
}
export interface OwnedSets { [setCode: string]: boolean; }

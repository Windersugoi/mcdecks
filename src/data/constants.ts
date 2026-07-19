import { Colors } from '@/styles/theme';
import { HeroRule } from './types';
import { HERO_SETS_BY_CYCLE, VILLAIN_SETS_BY_CYCLE, VILLAIN_TO_SET, HERO_TO_SET } from './cards';

export const ASPECTS: Record<string, string> = Colors.aspects;
export const ASPECT_LIST = ['Aggression', 'Justice', 'Leadership', 'Protection'];
export const ASPECT_DISPLAY: Record<string, string> = {
  Aggression: 'Aggression', Justice: 'Justice',
  Leadership: 'Leadership', Protection: 'Protection', Basic: 'Basic',
};
export const displayAspect = (a: string) => ASPECT_DISPLAY[a] ?? a;
export const aspectColor = (a: string) => (Colors.aspects as any)[a] ?? Colors.textMuted;

export const MULTI_ASPECT_HEROES: Record<string, HeroRule> = {
  'Spider-Woman': { rule:'dual', exactAspects:2, maxCopies:4,
    note:'Must choose exactly 2 aspects with equal cards from each.' },
  'Adam Warlock': { rule:'all4', exactAspects:4, maxCopies:1,
    note:'Must include all 4 aspects in equal quantities. Max 1 copy per card (except basics).' },
};

export { HERO_SETS_BY_CYCLE, VILLAIN_SETS_BY_CYCLE, VILLAIN_TO_SET, HERO_TO_SET };
export const HERO_LIST = Object.values(HERO_SETS_BY_CYCLE).flat();
export const VILLAIN_LIST = Object.values(VILLAIN_SETS_BY_CYCLE).flat();

export const MODULAR_LIST = [
  'Bomb Scare','Masters of Evil','Under Attack','The Doomsday Chair',
  'Legions of Hydra','Standard','Expert','Kree Fanatic',
];
export const DECK_MIN = 40;
export const DECK_MAX = 50;
export const COMING_SOON_CYCLES = ['Fear No Evil'];

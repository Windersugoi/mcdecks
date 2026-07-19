import { DeckCards } from '@/data/types';
import { ASPECT_CARDS } from '@/data/cards';

// Buscar carta por nombre exacto Y setCode para evitar cartas homónimas de otros sets
function findCardInSet(name: string, setCode: string): string | null {
  const card = ASPECT_CARDS.find(c => c.name.startsWith(name) && c.setCode === setCode);
  return card?.id ?? null;
}

// Buscar básicas (sin setCode específico)
function findBasic(name: string): string | null {
  const card = ASPECT_CARDS.find(c => c.name.startsWith(name) && c.aspect === 'Basic');
  return card?.id ?? null;
}

function buildCards(
  aspectList: [string, number, string][],
  basicList: string[]
): DeckCards {
  const cards: DeckCards = {};
  for (const [name, qty, setCode] of aspectList) {
    const id = findCardInSet(name, setCode);
    if (id) cards[id] = qty;
  }
  for (const name of basicList) {
    const id = findBasic(name);
    if (id) cards[id] = 1;
  }
  return cards;
}

const BASICS = [
  'Mockingbird','Nick Fury','Emergency','First Aid',
  'Haymaker','Energy','Genius','Strength',
  'Avengers Mansion','Helicarrier','Tenacity',
];

// Spider-Man + Justice (Core Set manual)
export function buildSpiderManJusticeDeck(): DeckCards {
  return buildCards([
    ['Daredevil',           1, 'Core'],
    ['For Justice!',        2, 'Core'],
    ['Great Responsibility',2, 'Core'],
    ['Interrogation Room',  2, 'Core'],
    ['Heroic Intuition',    2, 'Core'],
    ['Jessica Jones',       1, 'Core'],
    ['The Power of Justice',2, 'Core'],
    ['Surveillance Team',   2, 'Core'],
  ], BASICS);
}

// Captain Marvel + Leadership (Core Set manual)
export function buildCaptainMarvelLeadershipDeck(): DeckCards {
  return buildCards([
    ['Hawkeye',              1, 'Core'],
    ['Maria Hill',           1, 'Core'],
    ['Vision',               1, 'Core'],
    ['Get Ready',            2, 'Core'],
    ['Lead from the Front',  2, 'Core'],
    ['Make the Call',        2, 'Core'],
    ['The Power of Leadership',2,'Core'],
    ['The Triskelion',       1, 'Core'],
    ['Inspired',             2, 'Core'],
  ], BASICS);
}

/**
 * Card Image Service
 * Fetches card images from marvelcdb public API.
 * 
 * Strategy:
 * 1. On first request, fetch ALL cards from marvelcdb and build a complete name→URL map
 * 2. Fallback to our hardcoded URLs (from Excel pack codes) if API fails
 * 3. Everything is cached in memory for the session
 */


const MCDB_BASE = 'https://marvelcdb.com';
const ALL_CARDS_URL = `${MCDB_BASE}/api/public/cards/`;

// name → full image URL (player cards)
const imageCache: Record<string, string> = {};
// marvelcdb card code → card name (para import de mazos)
const codeToNameCache: Record<string, string> = {};

// villain/encounter name → full image URL
const villainImageCache: Record<string, string> = {};

// URLs de imágenes de villanos
// Formato marvelcdb: https://marvelcdb.com/bundles/cards/{packCode}{num}.png
// Pack codes: core(01), gob(02), riseofredskull(04), wreckingcrew(07),
//   kang(11), galaxymostwanted(16), themadtitansshadow(21), thehood(24),
//   sinistermotives(27), mutantgenesis(32), magog(39), nexusevent(40),
//   ageofapocalypse(45), agentsofshield(50), civilwar(56), synthezoidsmackdown(57)
// Nota: packs 50+ pueden no tener imágenes aún en marvelcdb

const BASE = 'https://marvelcdb.com/bundles/cards';

const KNOWN_VILLAIN_URLS: Record<string, string> = {
  // ── Core Set ────────────────────────────────────────────────────────────
  'Rhino':               `${BASE}/core094.png`,
  'Klaw':                `${BASE}/core113.png`,
  'Ultron':              `${BASE}/core134.png`,

  // ── Ciclo 1 ─────────────────────────────────────────────────────────────
  'Green Goblin':        `${BASE}/gob001b.png`,
  'The Wrecking Crew':   `${BASE}/wreckingcrew002.png`,
  'Crossbones':          `${BASE}/riseofredskull058.png`,
  'Absorbing Man':       `${BASE}/riseofredskull076.png`,
  'Taskmaster':          `${BASE}/riseofredskull093.png`,
  'Zola':                `${BASE}/riseofredskull109.png`,
  'Red Skull':           `${BASE}/riseofredskull125.png`,

  // ── Ciclo 2 ─────────────────────────────────────────────────────────────
  'Kang':                `${BASE}/kang001.png`,
  'Drang':               `${BASE}/galaxymostwanted058.png`,
  'The Collector':       `${BASE}/galaxymostwanted070.png`,
  'Nebula (V)':          `${BASE}/galaxymostwanted088.png`,
  'Ronan the Accuser':   `${BASE}/galaxymostwanted103.png`,
  'Ebony Maw':           `${BASE}/themadtitansshadow071.png`,
  'Proxima Midnight':    `${BASE}/themadtitansshadow092.png`,
  'Corvus Glaive':       `${BASE}/themadtitansshadow095.png`,
  'Thanos':              `${BASE}/themadtitansshadow111.png`,

  // ── Ciclo 3 ─────────────────────────────────────────────────────────────
  'The Hood':            `${BASE}/thehood001.png`,
  'Sandman':             `${BASE}/sinistermotives061.png`,
  'Venom (V)':           `${BASE}/sinistermotives073.png`,
  'Mysterio':            `${BASE}/sinistermotives084.png`,
  'Doctor Octopus':      `${BASE}/sinistermotives094.png`,
  'Electro':             `${BASE}/sinistermotives095.png`,
  'Hobgoblin':           `${BASE}/sinistermotives096.png`,
  'Scorpion':            `${BASE}/sinistermotives098.png`,
  'Vulture':             `${BASE}/sinistermotives099.png`,
  'Venom Goblin':        `${BASE}/sinistermotives073.png`,

  // ── Ciclo 4 ─────────────────────────────────────────────────────────────
  'Sabretooth':          `${BASE}/mutantgenesis060.png`,
  'Sentinel':            `${BASE}/mutantgenesis085.png`,
  'Master Mold':         `${BASE}/mutantgenesis109.png`,
  'Magneto (V)':         `${BASE}/mutantgenesis138.png`,
  'Mojo':                `${BASE}/magog022.png`,
  'Spiral':              `${BASE}/magog035.png`,
  'Enchantress':         `${BASE}/thorandfriends001.png`,

  // ── Ciclo 5 ─────────────────────────────────────────────────────────────
  'Juggernaut':          `${BASE}/nexusevent118.png`,
  'Mister Sinister':     `${BASE}/nexusevent085.png`,
  'Stryfe':              `${BASE}/nexusevent100.png`,
  'Unus':                `${BASE}/ageofapocalypse059.png`,
  'Four Horsemen':       `${BASE}/ageofapocalypse085.png`,
  'Dark Beast':          `${BASE}/ageofapocalypse118.png`,
  'Apocalypse':          `${BASE}/ageofapocalypse103a.png`,

  // ── Agents of S.H.I.E.L.D. (pack 50) ────────────────────────────────────
  // Códigos confirmados por el usuario desde imágenes físicas
  'Black Widow (V)':     `${BASE}/agentsofshield064.png`,
  'Batroc':              `${BASE}/agentsofshield086a.png`,   // confirmado: 50086A
  'M.O.D.O.K.':         `${BASE}/agentsofshield103a.png`,   // confirmado: 50103A
  'Baron Zemo':          `${BASE}/agentsofshield165a.png`,   // confirmado: 50165A

  // ── Civil War (pack 56) ──────────────────────────────────────────────────
  // Líderes — funcionan como villanos en estos escenarios
  'Iron Man (L)':        `${BASE}/civilwar059.png`,          // confirmado: 56059
  'Captain Marvel (L)':  `${BASE}/civilwar092.png`,          // confirmado: 56092
  'Captain America (L)': `${BASE}/civilwar137.png`,          // confirmado: 56137
  'Spider-Woman (L)':    `${BASE}/civilwar168.png`,          // confirmado: 56168

  // ── Synthezoid Smackdown (pack 57) ──────────────────────────────────────
  'She-Hulk (L)':        `${BASE}/synthezoidsmackdown001.png`,  // confirmado: 57001
  'Vision (L)':          `${BASE}/synthezoidsmackdown040.png`,  // confirmado: 57040
};
let allCardsFetched = false;
let fetchPromise: Promise<void> | null = null;

async function fetchAllCards(): Promise<void> {
  if (allCardsFetched) return;
  if (fetchPromise) return fetchPromise;

  fetchPromise = (async () => {
    try {
      const resp = await fetch(ALL_CARDS_URL, {
        headers: { 'Accept': 'application/json' },
      });
      if (!resp.ok) return;

      const cards: any[] = await resp.json();
      for (const card of cards) {
        if (!card.name || !card.imagesrc) continue;
        const url = `${MCDB_BASE}${card.imagesrc}`;
        const cleanName = card.name.replace(/\s*\(.*?\)\s*$/g, '').trim();

        // Clasificar por tipo de carta
        const cardType = (card.type_code ?? card.type ?? '').toLowerCase();
        const isVillain = cardType.includes('villain') || cardType.includes('main_scheme') ||
                          cardType.includes('encounter') || card.name.endsWith(' (I)') ||
                          card.name.endsWith(' (II)') || card.name.endsWith(' (III)');

        if (isVillain) {
          villainImageCache[card.name] = url;
          if (cleanName && !villainImageCache[cleanName]) villainImageCache[cleanName] = url;
        } else {
          imageCache[card.name] = url;
          if (cleanName && !imageCache[cleanName]) imageCache[cleanName] = url;
        }
        if (card.code) {
          imageCache['code:' + card.code] = url;
          codeToNameCache[card.code] = card.name; // para import
        }
      }
      allCardsFetched = true;
    } catch (err) {
      // API unreachable — will use fallback URLs
      console.warn('marvelcdb API unavailable, using fallback URLs');
      allCardsFetched = true; // prevent retry loop
    }
  })();

  return fetchPromise;
}

/**
 * Resolve the image URL for a card.
 * @param cardName  Card name (English, from database)
 * @param fallbackUrl  Hardcoded URL from our database (may or may not work)
 */
export async function resolveCardImage(
  cardName: string,
  _setCode?: string,
  fallbackUrl?: string,
): Promise<string | null> {
  // Already cached?
  if (imageCache[cardName]) return imageCache[cardName];

  // Fetch all cards if not done yet
  await fetchAllCards();

  // Try exact name match after fetch
  if (imageCache[cardName]) return imageCache[cardName];

  // Try partial name match (for names with suffixes like "(J)", "(PP)Ally", etc.)
  const baseName = cardName.replace(/\s*[\/(].*$/g, '').trim();
  if (baseName !== cardName && imageCache[baseName]) {
    imageCache[cardName] = imageCache[baseName]; // cache for next time
    return imageCache[baseName];
  }

  // Use our hardcoded URL as last resort
  return fallbackUrl ?? null;
}

/** Pre-load Core Set cards on app startup (most commonly used) */
export async function preloadCoreSet(): Promise<void> {
  // Fetch all cards — this also covers Core Set
  fetchAllCards(); // fire and forget, no await
}

/** Get cached URL synchronously (for cases where you don't want to await) */
export function getCachedImage(cardName: string, fallbackUrl?: string): string | null {
  return imageCache[cardName] ?? fallbackUrl ?? null;
}
/** Get image URL for a villain card */
export async function getVillainImage(villainName: string): Promise<string | null> {
  // 0. Imagen local (para cartas sin imagen en marvelcdb)
  // Las imágenes locales se gestionan via getLocalVillainImage() en el componente

  // 1. Check hardcoded known URLs first
  const known = KNOWN_VILLAIN_URLS[villainName];
  if (known) return known;

  // 2. Check villain cache (populated after fetchAllCards)
  if (villainImageCache[villainName]) return villainImageCache[villainName];

  // 3. Fetch all cards to populate the cache
  await fetchAllCards();

  // 4. Try villain cache again
  if (villainImageCache[villainName]) return villainImageCache[villainName];

  // 5. Try the villain name with " (I)" suffix (Stage I card)
  const stageOne = `${villainName} (I)`;
  if (villainImageCache[stageOne]) return villainImageCache[stageOne];

  // 6. Try player card cache as last resort (some villains appear as player cards)
  if (imageCache[villainName]) return imageCache[villainName];

  // 7. Try constructing URL from known pattern
  // Most villains appear after player cards in their set
  return null;
}

/** Obtiene el nombre de una carta por su código marvelcdb (para import de mazos) */
export async function getCardNameByMcdbCode(code: string): Promise<string | null> {
  if (codeToNameCache[code]) return codeToNameCache[code];
  await fetchAllCards();
  return codeToNameCache[code] ?? null;
}

/** Verifica si las cartas de marvelcdb ya están cargadas */
export function areMcdbCardsLoaded(): boolean {
  return allCardsFetched;
}

/** Returns map of marvelcdb card code → full imgsrc URL (for deck import) */
export function getMcdbCodeToImgsrc(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const [key, url] of Object.entries(imageCache)) {
    if (key.startsWith('code:')) {
      map[key.replace('code:', '')] = url;
    }
  }
  return map;
}

/** Ensure all cards have been fetched from marvelcdb (for import mapping) */
export async function preloadAllCards(): Promise<void> {
  await fetchAllCards();
}

import React, { createContext, useContext, useState, ReactNode, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Deck, OwnedSets } from '@/data/types';
import { VILLAIN_LIST } from '@/data/constants';
import { CORE_CAMPAIGN_NORMAL, CORE_CAMPAIGN_EXPERT, SET_TO_CAMPAIGN } from '@/data/campaigns';
import { buildSpiderManJusticeDeck, buildCaptainMarvelLeadershipDeck } from '@/utils/defaultDecks';

const STORAGE_DECKS    = 'mcdecks_v1_decks';
const STORAGE_OWNED    = 'mcdecks_v1_owned';
const STORAGE_ACTIVE   = 'mcdecks_v1_active';
const STORAGE_TUTORIAL = 'mcdecks_v1_tutorial';

function makeDeckTracking() {
  return {
    villains: Object.fromEntries(VILLAIN_LIST.map(v => [v, { defeated: false, modular: [] }])),
    campaigns: {
      [CORE_CAMPAIGN_NORMAL.id]: { completed: false, entriesCompleted: {} },
      [CORE_CAMPAIGN_EXPERT.id]: { completed: false, entriesCompleted: {} },
    },
  };
}

function makeDefaultDecks(): Deck[] {
  return [
    { id:'demo_sm', name:'Spider-Man — Justice', hero:'Spider-Man',
      aspects:['Justice'], cards:buildSpiderManJusticeDeck(), ...makeDeckTracking() },
    { id:'demo_cm', name:'Captain Marvel — Leadership', hero:'Captain Marvel',
      aspects:['Leadership'], cards:buildCaptainMarvelLeadershipDeck(), ...makeDeckTracking() },
  ];
}

interface AppCtx {
  decks: Deck[]; setDecks: React.Dispatch<React.SetStateAction<Deck[]>>;
  activeDeckId: string | null; setActiveDeckId: React.Dispatch<React.SetStateAction<string | null>>;
  activeDeck: Deck | null;
  ownedSets: OwnedSets; setOwnedSets: React.Dispatch<React.SetStateAction<OwnedSets>>;
  createDeck: () => string;
  makeDeckTracking: typeof makeDeckTracking;
  showTutorial: boolean;
  dismissTutorial: (dontShowAgain?: boolean) => void;
  officialCampaigns: import('@/data/types').Campaign[];
  isLoading: boolean;
  lightMode: boolean;
  setLightMode: (v: boolean) => void;
}

const AppContext = createContext<AppCtx | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null);
  const [ownedSets, setOwnedSets] = useState<OwnedSets>({ Core: true });
  const [showTutorial, setShowTutorial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lightMode, setLightModeRaw] = useState(false);
  const initialized = useRef(false);

  const activeDeck = decks.find(d => d.id === activeDeckId) ?? null;

  // ── Cargar datos guardados al iniciar ────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      try {
        const [savedDecks, savedOwned, savedActive, tutorialSeen, savedLight] = await Promise.all([
          AsyncStorage.getItem(STORAGE_DECKS),
          AsyncStorage.getItem(STORAGE_OWNED),
          AsyncStorage.getItem(STORAGE_ACTIVE),
          AsyncStorage.getItem(STORAGE_TUTORIAL),
          AsyncStorage.getItem('mcdecks_v1_lightmode'),
        ]);

        if (savedDecks) {
          const parsed: Deck[] = JSON.parse(savedDecks);
          setDecks(parsed.length > 0 ? parsed : makeDefaultDecks());
        } else {
          setDecks(makeDefaultDecks());
        }
        if (savedOwned)  setOwnedSets(JSON.parse(savedOwned));
        if (savedActive) setActiveDeckId(savedActive);
        setShowTutorial(tutorialSeen !== 'true');
        const savedLight = await AsyncStorage.getItem('mcdecks_v1_lightmode');
        if (savedLight === 'true') setLightModeRaw(true);
      } catch {
        setDecks(makeDefaultDecks());
        setShowTutorial(true);
      } finally {
        initialized.current = true;
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // ── Guardar decks cuando cambian ─────────────────────────────────────────
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(STORAGE_DECKS, JSON.stringify(decks)).catch(() => {});
  }, [decks]);

  // ── Guardar ownedSets cuando cambian ─────────────────────────────────────
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(STORAGE_OWNED, JSON.stringify(ownedSets)).catch(() => {});
  }, [ownedSets]);

  // ── Guardar activeDeckId cuando cambia ───────────────────────────────────
  useEffect(() => {
    if (!initialized.current) return;
    AsyncStorage.setItem(STORAGE_ACTIVE, activeDeckId ?? '').catch(() => {});
  }, [activeDeckId]);

  function createDeck(): string {
    const id = 'd' + Date.now();
    setDecks(prev => [...prev, {
      id, name: 'New Deck', hero: null, aspects: [], cards: {},
      ...makeDeckTracking(),
    }]);
    return id;
  }

  function setLightMode(v: boolean) {
    setLightModeRaw(v);
    AsyncStorage.setItem('mcdecks_v1_lightmode', v ? 'true' : 'false').catch(() => {});
  }

  function dismissTutorial(dontShowAgain = false) {
    setShowTutorial(false);
    if (dontShowAgain) {
      AsyncStorage.setItem(STORAGE_TUTORIAL, 'true').catch(() => {});
    }
  }

  const officialCampaigns = Object.keys(ownedSets)
    .filter(code => ownedSets[code])
    .flatMap(code => SET_TO_CAMPAIGN[code] ?? []);

  return (
    <AppContext.Provider value={{
      decks, setDecks, activeDeckId, setActiveDeckId, activeDeck,
      ownedSets, setOwnedSets, createDeck, makeDeckTracking,
      showTutorial, dismissTutorial, officialCampaigns, isLoading,
      lightMode, setLightMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}

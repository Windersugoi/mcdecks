import { Campaign } from './types';

// ─── Campañas oficiales del Core Set ──────────────────────────────────────────
export const CORE_CAMPAIGN_NORMAL: Campaign = {
  id:'camp_core_normal', name:'First Encounters — Normal', source:'official', mode:'normal',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/27/52/27529566-e916-46fc-b0a9-1fc4bceee576/mc01en_main.png',
  entries:[
    { villain:'Rhino',  stages:'1 & 2', modular:['Standard','Bomb Scare'] },
    { villain:'Klaw',   stages:'1 & 2', modular:['Standard','Masters of Evil'] },
    { villain:'Ultron', stages:'1 & 2', modular:['Standard','Under Attack'] },
  ],
};
export const CORE_CAMPAIGN_EXPERT: Campaign = {
  id:'camp_core_expert', name:'First Encounters — Expert', source:'official', mode:'expert',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/27/52/27529566-e916-46fc-b0a9-1fc4bceee576/mc01en_main.png',
  entries:[
    { villain:'Rhino',  stages:'2 & 3', modular:['Standard','Expert','Bomb Scare'] },
    { villain:'Klaw',   stages:'1 & 2', modular:['Standard','Expert','Masters of Evil'] },
    { villain:'Ultron', stages:'1 & 2', modular:['Standard','Expert','Under Attack'] },
  ],
};

// ─── Rise of Red Skull ─────────────────────────────────────────────────────────
export const RISE_RED_SKULL: Campaign = {
  id:'camp_rors', name:'The Rise of Red Skull', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/cc/29/cc297241-6129-4702-9c30-e67bafabb413/mc10en-box-left500.png',
  entries:[
    { villain:'Crossbones',   stages:'1–3', modular:['Standard','Masters of Evil'] },
    { villain:'Absorbing Man',stages:'1–3', modular:['Standard','Legions of Hydra'] },
    { villain:'Taskmaster',   stages:'1–3', modular:['Standard','Hydra Assault'] },
    { villain:'Zola',         stages:'1–3', modular:['Standard','Weapon Master'] },
    { villain:'Red Skull',    stages:'1–3', modular:['Standard','Masters of Evil','Legions of Hydra'] },
  ],
};

// ─── Galaxy's Most Wanted ──────────────────────────────────────────────────────
export const GALAXYS_MOST_WANTED: Campaign = {
  id:'camp_gmw', name:"Galaxy's Most Wanted", source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/33/6b/336b7050-2f2f-42fc-9313-8d0d9a478e92/mc16en-box-left500.png',
  entries:[
    { villain:'Drang',           stages:'1–3', modular:['Standard','Band of Badoon'] },
    { villain:'The Collector',   stages:'1 & 2', modular:['Standard','Galactic Artifacts'] },
    { villain:'Nebula (V)',      stages:'1–3', modular:['Standard','Space Pirates'] },
    { villain:'Ronan the Accuser',stages:'1–3', modular:['Standard','Kree Militants'] },
  ],
};

// ─── The Mad Titan's Shadow ────────────────────────────────────────────────────
export const MAD_TITANS_SHADOW: Campaign = {
  id:'camp_mts', name:"The Mad Titan's Shadow", source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/c2/31/c231d81a-c118-4aff-a08a-41577c65cf46/mc21en-box-left500.png',
  entries:[
    { villain:'Ebony Maw',      stages:'1–3', modular:['Standard','Black Order'] },
    { villain:'Proxima Midnight',stages:'1–3', modular:['Standard','Black Order'] },
    { villain:'Corvus Glaive',  stages:'1–3', modular:['Standard','Armies of Titan'] },
    { villain:'Thanos',         stages:'1–3', modular:['Standard','Black Order','Armies of Titan'] },
  ],
};

// ─── Sinister Motives ──────────────────────────────────────────────────────────
export const SINISTER_MOTIVES: Campaign = {
  id:'camp_sm', name:'Sinister Motives', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/35/d8/35d88f6a-8936-451a-8616-08b5a69ae57e/mc27en-sinistermotives_boxfront_right.png',
  entries:[
    { villain:'Sandman',      stages:'1–3', modular:['Standard'] },
    { villain:'Venom (V)',    stages:'1–3', modular:['Standard','Goblin Gear'] },
    { villain:'Mysterio',     stages:'1–3', modular:['Standard','Mystic Arts'] },
    { villain:'Doctor Octopus',stages:'1–3', modular:['Standard','Sinister Six'] },
    { villain:'Venom Goblin', stages:'1–3', modular:['Standard','Goblin Gear','Sinister Six'] },
  ],
};

// ─── Mutant Genesis ────────────────────────────────────────────────────────────
export const MUTANT_GENESIS: Campaign = {
  id:'camp_mg', name:'Mutant Genesis', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/4e/09/4e09398d-198a-4201-ac8d-dc3233ab7a2a/mc32_box-left500.png',
  entries:[
    { villain:'Sabretooth',  stages:'1–3', modular:['Standard','Sentinels'] },
    { villain:'Sentinel',    stages:'1–3', modular:['Standard','Sentinels'] },
    { villain:'Master Mold', stages:'1–3', modular:['Standard','Weapon X'] },
    { villain:'Magneto (V)', stages:'1–3', modular:['Standard','Brotherhood','Acolytes'] },
  ],
};

// ─── Nexus Event ──────────────────────────────────────────────────────────────
export const NEXUS_EVENT: Campaign = {
  id:'camp_ne', name:'Nexus Event', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/9b/bd/9bbd55a6-76b7-49e4-8fd2-455b4ba1409e/mc40_box-left500.png',
  entries:[
    { villain:'Juggernaut',    stages:'1–3', modular:['Standard'] },
    { villain:'Mister Sinister',stages:'1–3', modular:['Standard','Mutant Slayers'] },
    { villain:'Stryfe',        stages:'1–3', modular:['Standard','Mutant Slayers','Mercenaries'] },
  ],
};

// ─── Age of Apocalypse ────────────────────────────────────────────────────────
export const AGE_OF_APOCALYPSE: Campaign = {
  id:'camp_aoa', name:'Age of Apocalypse', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/86/54/8654d4c3-4167-4fd6-b69f-ec89151e8ebe/mc45-image0500.png',
  entries:[
    { villain:'Unus',         stages:'1–3', modular:['Standard'] },
    { villain:'Four Horsemen',stages:'1–3', modular:['Standard','Horsemen'] },
    { villain:'Dark Beast',   stages:'1–3', modular:['Standard','Dark Agents'] },
    { villain:'Apocalypse',   stages:'1–3', modular:['Standard','Horsemen','Dark Agents'] },
  ],
};

// ─── Agents of SHIELD ─────────────────────────────────────────────────────────
export const AGENTS_OF_SHIELD: Campaign = {
  id:'camp_aos', name:'Agents of S.H.I.E.L.D.', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/83/d0/83d0bb2e-9e22-411d-8681-cc94eaa80278/mc50-image0500.png',
  entries:[
    { villain:'Black Widow (V)', stages:'1–3', modular:['Standard','A.I.M.'] },
    { villain:'Batroc',          stages:'1',   modular:['Standard'] },
    { villain:'M.O.D.O.K.',      stages:'1–3', modular:['Standard','A.I.M. Overlords'] },
    { villain:'Thunderbolts',    stages:'1–3', modular:['Standard','Thunderbolts'] },
    { villain:'Baron Zemo',      stages:'1 & 2', modular:['Standard','Thunderbolts','Masters of Evil'] },
  ],
};
// Fear No Evil: primera campaña con 6 escenarios (en vez de los 5 habituales).
// Los 5 villanos callejeros se pueden combinar libremente con distintos
// escenarios/sets modulares (diseño "mix and match" oficial) — aquí se deja
// un modular base razonable por villano; Kingpin es el final de campaña.
export const FEAR_NO_EVIL: Campaign = {
  id:'camp_fne', name:'Fear No Evil', source:'official',
  boxImage:'https://images-cdn.fantasyflightgames.com/filer_public/c2/53/c253b342-6e07-4dca-8a8c-99177b5ac918/mc60-image0500.png',
  entries:[
    { villain:'Bullseye',       stages:'1', modular:['Standard'] },
    { villain:'Electro (II)',   stages:'1', modular:['Standard'] },
    { villain:'Hammerhead',     stages:'1', modular:['Standard'] },
    { villain:'Purple Man',     stages:'1', modular:['Standard'] },
    { villain:'Typhoid Mary',   stages:'1', modular:['Standard'] },
    { villain:'Kingpin',        stages:'1–3', modular:['Standard','Tracksuit Mafia'] },
  ],
};

// ─── Mapa setCode → campaña oficial ──────────────────────────────────────────
export const SET_TO_CAMPAIGN: Record<string, Campaign[]> = {
  'Core':    [CORE_CAMPAIGN_NORMAL, CORE_CAMPAIGN_EXPERT],
  'A:TRoRS': [RISE_RED_SKULL],
  'G:GMW':   [GALAXYS_MOST_WANTED],
  'G:TMTS':  [MAD_TITANS_SHADOW],
  'W:SM':    [SINISTER_MOTIVES],
  'X:MG':    [MUTANT_GENESIS],
  'X:NE':    [NEXUS_EVENT],
  'X:AoA':   [AGE_OF_APOCALYPSE],
  'S:AoS':   [AGENTS_OF_SHIELD],
  'D:FNE':   [FEAR_NO_EVIL],
};

export const DEFAULT_CAMPAIGNS_NORMAL: Campaign[] = [CORE_CAMPAIGN_NORMAL];
export const DEFAULT_CAMPAIGNS_EXPERT: Campaign[] = [CORE_CAMPAIGN_EXPERT];
export const COMMUNITY_CAMPAIGNS: Campaign[] = [
  { id:'comm1', name:'El ascenso de Hydra', source:'community', author:'ironfan22',
    entries:[{villain:'Klaw',modular:['Legions of Hydra']}], rating:4.8, votes:132 },
  { id:'comm2', name:'Crisis multiversal', source:'community', author:'snikt_99',
    entries:[{villain:'Ultron',modular:[]},{villain:'Klaw',modular:[]},{villain:'Rhino',modular:[]}],
    rating:4.5, votes:87 },
];

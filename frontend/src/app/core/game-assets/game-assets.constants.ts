import { AgentRole } from './game-assets.model';

/** Folder of the images fetched by `frontend/scripts/fetch_valorant_assets.py`. */
export const ASSETS_ROOT = 'assets/valorant';

/** Role of each agent, from Data Dragon; rerun the fetch script when a new agent ships. */
export const AGENT_ROLES: Readonly<Record<string, AgentRole>> = {
  Astra: 'Controller',
  Breach: 'Initiator',
  Brimstone: 'Controller',
  Chamber: 'Sentinel',
  Clove: 'Controller',
  Cypher: 'Sentinel',
  Deadlock: 'Sentinel',
  Fade: 'Initiator',
  Gekko: 'Initiator',
  Harbor: 'Controller',
  Iso: 'Duelist',
  Jett: 'Duelist',
  'KAY/O': 'Initiator',
  Killjoy: 'Sentinel',
  Miks: 'Controller',
  Neon: 'Duelist',
  Omen: 'Controller',
  Phoenix: 'Duelist',
  Raze: 'Duelist',
  Reyna: 'Duelist',
  Sage: 'Sentinel',
  Skye: 'Initiator',
  Sova: 'Initiator',
  Tejo: 'Initiator',
  Veto: 'Sentinel',
  Viper: 'Controller',
  Vyse: 'Sentinel',
  Waylay: 'Duelist',
  Yoru: 'Duelist',
};

/** Role names as the squad says them. */
export const ROLE_LABELS: Readonly<Record<AgentRole, string>> = {
  Duelist: 'Duelliste',
  Initiator: 'Initiateur',
  Controller: 'Contrôleur',
  Sentinel: 'Sentinelle',
};

/** Maps with a banner and a splash in the assets folder. */
export const KNOWN_MAPS: ReadonlySet<string> = new Set([
  'Abyss',
  'Ascent',
  'Bind',
  'Breeze',
  'Corrode',
  'Fracture',
  'Haven',
  'Icebox',
  'Lotus',
  'Pearl',
  'Split',
  'Summit',
  'Sunset',
]);

/** Weapons with a silhouette in the assets folder. */
export const KNOWN_WEAPONS: ReadonlySet<string> = new Set([
  'Classic',
  'Shorty',
  'Frenzy',
  'Ghost',
  'Bandit',
  'Sheriff',
  'Stinger',
  'Spectre',
  'Bucky',
  'Judge',
  'Bulldog',
  'Guardian',
  'Phantom',
  'Vandal',
  'Marshal',
  'Outlaw',
  'Operator',
  'Ares',
  'Odin',
  'Melee',
]);

import { AGENTS_HELP } from './agents-help.constants';
import { BEHAVIOR_HELP } from './behavior-help.constants';
import { COMBAT_HELP } from './combat-help.constants';
import { CONTEXT_HELP } from './context-help.constants';
import { ECONOMY_HELP } from './economy-help.constants';
import { OPENING_HELP } from './opening-help.constants';
import { PLAYERS_HELP } from './players-help.constants';
import { POSITIONS_HELP } from './positions-help.constants';
import { READING_HELP } from './reading-help.constants';
import { RESULTS_HELP } from './results-help.constants';
import { REVENGE_HELP } from './revenge-help.constants';
import { SITUATIONS_HELP } from './situations-help.constants';
import { SPIKE_HELP } from './spike-help.constants';
import { SQUAD_HELP } from './squad-help.constants';
import { STRATEGY_HELP } from './strategy-help.constants';
import { StatHelp } from './stat-help.model';
import { TIMINGS_HELP } from './timings-help.constants';
import { UTILITY_HELP } from './utility-help.constants';
import { VIEWS_HELP } from './views-help.constants';
import { WEAPONS_HELP } from './weapons-help.constants';

/** A group of explanations: one domain of the metrics dictionary. */
export interface HelpSection {
  key: string;
  label: string;
  entries: Readonly<Record<string, StatHelp>>;
}

/** Every group of explanations, one per domain of the metrics dictionary. */
export const HELP_SECTIONS: readonly HelpSection[] = [
  { key: 'results', label: 'Résultats', entries: RESULTS_HELP },
  { key: 'opening', label: 'Ouvertures', entries: OPENING_HELP },
  { key: 'combat', label: 'Combat', entries: COMBAT_HELP },
  { key: 'revenge', label: 'Revenge et espacement', entries: REVENGE_HELP },
  { key: 'situations', label: 'Situations', entries: SITUATIONS_HELP },
  { key: 'spike', label: 'Spike', entries: SPIKE_HELP },
  { key: 'economy', label: 'Économie', entries: ECONOMY_HELP },
  { key: 'weapons', label: 'Armes', entries: WEAPONS_HELP },
  { key: 'utility', label: 'Utilitaire', entries: UTILITY_HELP },
  { key: 'timings', label: 'Timings', entries: TIMINGS_HELP },
  { key: 'positions', label: 'Positions', entries: POSITIONS_HELP },
  { key: 'agents', label: 'Agents et compos', entries: AGENTS_HELP },
  { key: 'context', label: 'Contexte', entries: CONTEXT_HELP },
  { key: 'behavior', label: 'Comportement', entries: BEHAVIOR_HELP },
  { key: 'squad', label: 'Escouade', entries: SQUAD_HELP },
  { key: 'strategy', label: 'Stratégie', entries: STRATEGY_HELP },
  { key: 'players', label: 'Joueurs', entries: PLAYERS_HELP },
  { key: 'views', label: 'Vues du rapport', entries: VIEWS_HELP },
  { key: 'reading', label: 'Lecture des chiffres', entries: READING_HELP },
];

/**
 * Every explanation by key, looked up by the "i" tips. Keys are unique across sections (the API's
 * column `help` keys point here).
 */
export const STAT_HELP: Readonly<Record<string, StatHelp>> = Object.assign(
  {},
  ...HELP_SECTIONS.map((s) => s.entries),
);

/** Explanation of a statistic, or null for an unknown key. */
export function helpFor(key: string | null | undefined): StatHelp | null {
  return key ? (STAT_HELP[key] ?? null) : null;
}

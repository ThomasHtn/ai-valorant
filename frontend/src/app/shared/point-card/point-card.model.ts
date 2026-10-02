import { LucideIcon } from '@lucide/angular';

import { BadgeContent } from '@core/common/badge.model';
import { Tone } from '@core/common/enums.model';
import { PointReference } from '@core/common/point-reference.model';
import { HelpTopic } from '@core/help/stat-help.constants';
import { FindingMatch, RewatchGroup } from '@core/periods/findings.model';

/**
 * Content of a point card, prepared once in a `computed`: building these arrays in a template
 * call would create new inputs on every change detection pass and loop forever.
 */
export interface PointCardContent {
  /** Scope of the point: maps, sides, players. */
  badges: BadgeContent[];
  /** Confirmed or lead, shown with the scope. */
  status: BadgeContent | null;
  title: string;
  /** The figure the title is about, drawn in the tone's colour. */
  value: string | null;
  details: (string | null)[];
  /** Same figure elsewhere (same level, top ranked), aligned under each other from row to row. */
  references?: PointReference[];
  /** Rounds to rewatch, folded under the point. */
  rewatch?: RewatchGroup[];
  tone: Tone;
  /** Where it happens when it is not a map ('Toutes cartes', a player's name). */
  place?: string | null;
  /** Portrait of the player the point is about. */
  agent?: string | null;
  /** Picture when there is neither a map nor a player. */
  icon?: LucideIcon | null;
  /** Explanation of the stat. */
  help?: HelpTopic | null;
  /** Matches the figure comes from, and what it counts in each. */
  matches?: FindingMatch[];
  unit?: string;
}

/** A reference column named once above a list of points. */
export interface PointColumn {
  label: string;
  help?: HelpTopic;
}

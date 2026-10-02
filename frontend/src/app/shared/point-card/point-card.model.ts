import { BadgeContent } from '@core/common/badge.model';
import { Tone } from '@core/common/enums.model';
import { RewatchGroup } from '@core/periods/findings.model';

/**
 * Content of a point card, prepared once in a `computed`: building these arrays in a template
 * call would create new inputs on every change detection pass and loop forever.
 */
export interface PointCardContent {
  /** Scope of the point: maps, sides, players. */
  badges: BadgeContent[];
  /** Confirmed or lead, shown on the right of the title. */
  status: BadgeContent | null;
  title: string;
  /** The figure the title is about, drawn in the tone's colour. */
  value: string | null;
  details: (string | null)[];
  /** Rounds to rewatch, folded under the point. */
  rewatch?: RewatchGroup[];
  tone: Tone;
}

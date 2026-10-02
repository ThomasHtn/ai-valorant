import { LucideIcon } from '@lucide/angular';

import { Tone } from '@core/common/enums.model';

/** One entry of the navigation. */
export interface NavLeaf {
  label: string;
  link: string | unknown[];
  active: boolean;
  icon?: LucideIcon;
  /** One plain line under the label saying what the page shows. */
  hint?: string;
  /** Short mark on the right (a score), coloured by `tone`. */
  note?: string;
  tone?: Tone;
}

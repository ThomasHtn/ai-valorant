import { LucideIcon } from '@lucide/angular';

import { Tone } from '@core/common/enums.model';

/** One entry of a sub-navigation. */
export interface TabItem {
  id: string;
  label: string;
  icon?: LucideIcon;
  /** Small mark after the label (a score, a count), coloured by `tone`. */
  note?: string;
  tone?: Tone;
}

/** A sub-navigation entry that is a route; the period query is kept when following it. */
export interface LinkTabItem extends TabItem {
  link: string | unknown[];
}

/** An entry of a picker: a map shown by its banner, a player by their main agent. */
export interface PickerItem extends TabItem {
  /** Route of the entry; without one the picker switches its `selected` value. */
  link?: string | unknown[];
  /** Map banner of a `banner` picker. */
  image?: string | null;
  /** Agent portrait of an `avatar` picker. */
  agent?: string | null;
}

/** `banner` for maps (wide image tiles), `avatar` for players (portrait pills). */
export type PickerLook = 'banner' | 'avatar';

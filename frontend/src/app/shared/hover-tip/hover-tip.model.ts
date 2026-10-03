/** One label / value line of a hover tip ('Arme' / 'Vandal'). */
export interface HoverTipLine {
  label: string;
  value: string;
}

/**
 * What a hover tip shows: an amber title, an optional sentence, label / value lines and a muted
 * note. Plain text only: the tip never renders HTML.
 */
export interface HoverTipContent {
  title: string;
  text?: string;
  lines?: HoverTipLine[];
  note?: string;
}

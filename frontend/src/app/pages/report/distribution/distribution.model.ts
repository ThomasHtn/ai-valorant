/** How a reading sentence names the two sides of a histogram. */
export interface ReadingWords {
  /** Subject of the sentence: "L'escouade", 'Psilonnix'. */
  who: string;
  /** Complement: "de l'escouade", 'de Psilonnix'. */
  of: string;
  /** Reference: 'le top ranked', 'le top ranked du même rôle'. */
  top: string;
}

/** Sentences of one histogram: median higher, lower, or equal to top ranked. `gap` is '2 s'. */
export interface ReadingTemplate {
  more: (gap: string, w: ReadingWords) => string;
  less: (gap: string, w: ReadingWords) => string;
  same: (w: ReadingWords) => string;
}

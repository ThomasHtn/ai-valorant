/** Score lead (or deficit) that makes a lost (or won) match a collapse (or comeback) worth telling. */
export const SWING_MIN_GAP = 4;

/** Rounds lost or won in a row before the streak becomes a fact of the match. */
export const STREAK_MIN = 5;

/** Rounds lost after a 70 % chance before they count as a fact; one or two happen in most matches. */
export const THROWN_MIN = 3;

/** Lost rounds of one cause before it is named as the match's main leak. */
export const CAUSE_MIN = 3;

/** Rounds won on an eco or force buy against a full buy before it counts as a fact. */
export const UNDERDOG_MIN = 2;

/** Facts shown per match: the card stays a summary, the match page has the rest. */
export const MAX_FACTS = 3;

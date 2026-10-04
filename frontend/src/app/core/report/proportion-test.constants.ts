/** Under this expected count, two rates are compared with Fisher's exact test (backend `MIN_EXPECTED_COUNT`). */
export const MIN_EXPECTED_COUNT = 5;

/** Lanczos approximation of log Γ (g = 7, 9 terms), accurate to about 1e-15. */
export const LANCZOS_G = 7;
export const LANCZOS_COEFFICIENTS = [
  0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
  -176.61503916999185, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
  1.5056327351493116e-7,
];

/** Tolerance on log probabilities when summing the tables at most as likely as the observed one. */
export const LOG_TOLERANCE = 1e-9;

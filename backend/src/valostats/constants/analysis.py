"""Thresholds of the statistical tests; changing one changes what the reports flag."""

# False discovery rate of the Benjamini-Hochberg correction.
FDR_Q = 0.10
# p-value under which an uncorrected gap is still shown, as a lead ("à confirmer").
LEAD_P_VALUE = 0.05
# Under this expected count in a cell, proportions are compared with Fisher's exact test instead of a z-test.
MIN_EXPECTED_COUNT = 5
# Matches (or player-matches) needed to estimate how alike the rounds of one match are; under it, no correction.
MIN_ICC_GROUPS = 10

/** A group of the period selector (Mois, Soirées, Patchs) and its options. */
export interface PeriodOptionGroup {
  label: string;
  options: { value: string; label: string }[];
}

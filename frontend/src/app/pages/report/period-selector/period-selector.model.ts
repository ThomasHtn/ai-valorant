/** A group of the period selector (Mois, Sessions, Patchs) and its options. */
export interface PeriodOptionGroup {
  label: string;
  options: { value: string; label: string }[];
}

/** `count` successes out of `total` tries; `value` is null when there was no try (mirror of the API's `Rate`). */
export interface Rate {
  count: number;
  total: number;
  value: number | null;
}

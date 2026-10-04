import { Reference, Side } from '@core/common/enums.model';
import { REFERENCE_OPTION_LABELS, SIDE_LABELS } from '@core/format/labels.constants';

/** Buttons of the "Comparer à" switch, in order. */
export const REFERENCE_OPTIONS: readonly { value: Reference; label: string }[] = (
  ['top', 'opp', 'hist'] as const
).map((value) => ({ value, label: REFERENCE_OPTION_LABELS[value] }));

/** Options of the side select; '' keeps both sides. */
export const SIDE_OPTIONS: readonly { value: Side | ''; label: string }[] = [
  { value: '', label: 'Les deux' },
  { value: 'att', label: SIDE_LABELS.att },
  { value: 'def', label: SIDE_LABELS.def },
];

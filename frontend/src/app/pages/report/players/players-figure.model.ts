import { ValueFormat } from '@core/format/value-format.model';
import { StatCell } from '@core/report/stat-table.model';

/** One figure of a player, read the same way by the radar, the stat bars and the verdict. */
export interface PlayerFigure {
  key: string;
  label: string;
  /** Glossary key of its "i" tip; null without one. */
  help: string | null;
  format: ValueFormat;
  /** 1 higher is better, -1 lower is better, 0 neutral. */
  better: number;
  /** Sample under which the figure is not judged. */
  min: number;
  /** What the sample counts ('rounds', 'morts', 'duels'); null when it is not worth writing. */
  unit: string | null;
  cell: StatCell;
}

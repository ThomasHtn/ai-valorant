import { RewatchRound } from '@core/report/findings.model';
import { GameArt } from '@core/report/stat-table.model';

/** One detection ready to draw: what, how much, on what sample, and the rounds behind it. */
export interface DetectionItem {
  key: string;
  art: GameArt | null;
  title: string;
  detail: string | null;
  sample: string | null;
  rewatch: RewatchRound[];
}

/** One list of the panel with its heading and glossary key. */
export interface DetectionGroup {
  key: 'repetitions' | 'gaps' | 'links';
  title: string;
  help: string;
  items: DetectionItem[];
}

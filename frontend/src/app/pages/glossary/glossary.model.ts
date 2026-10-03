import { StatHelp } from '@core/help/stat-help.model';

/** A glossary section after the search: its entries that match, with their keys. */
export interface GlossarySection {
  key: string;
  label: string;
  entries: { key: string; help: StatHelp }[];
}

import { HelpSection } from '@core/help/help-registry';

import { GlossarySection } from './glossary.model';

/** Lower case, accents removed, so 'econ' finds 'Économie'. */
export function normalise(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Sections with the entries whose texts contain the search; empty sections are dropped. */
export function searchGlossary(
  sections: readonly HelpSection[],
  search: string,
): GlossarySection[] {
  const needle = normalise(search.trim());
  return sections
    .map((section) => ({
      key: section.key,
      label: section.label,
      entries: Object.entries(section.entries)
        .filter(
          ([, help]) =>
            !needle ||
            normalise([help.title, help.what, help.how ?? '', help.read ?? ''].join(' ')).includes(
              needle,
            ),
        )
        .map(([key, help]) => ({ key, help })),
    }))
    .filter((section) => section.entries.length > 0);
}

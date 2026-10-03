import { HelpSection } from '@core/help/help-registry';

import { normalise, searchGlossary } from './glossary.utils';

const sections: HelpSection[] = [
  { key: 'economy', label: 'Économie', entries: { eco: { title: 'Eco', what: 'Achat léger.' } } },
  {
    key: 'combat',
    label: 'Combat',
    entries: { kast: { title: 'KAST', what: 'Kill, assist, survie.' } },
  },
];

describe('glossary utils', () => {
  it('ignores case and accents', () => {
    expect(normalise('Économie')).toBe('economie');
  });

  it('keeps every entry without a search and drops sections without a match', () => {
    expect(searchGlossary(sections, '').length).toBe(2);
    const found = searchGlossary(sections, 'survie');
    expect(found.map((s) => s.key)).toEqual(['combat']);
    expect(found[0].entries[0].key).toBe('kast');
  });
});

import {
  filterOptionGroups,
  findExactOption,
  normalizeOptionText,
} from './autocomplete-match.util';

const OPTIONS = [
  { value: 'Poland', viewValue: 'Poland' },
  { value: 'Portugal', viewValue: 'Portugal' },
  { value: 'Польша', viewValue: 'Польша' },
];

describe('normalizeOptionText', () => {
  it('ignores case and surrounding whitespace', () => {
    expect(normalizeOptionText('  Poland ')).toBe('poland');
    expect(normalizeOptionText('ПОЛЬША')).toBe('польша');
  });
});

describe('findExactOption', () => {
  it('selects on a complete match', () => {
    expect(findExactOption(OPTIONS, 'Poland')?.value).toBe('Poland');
    expect(findExactOption(OPTIONS, 'poland')?.value).toBe('Poland');
    expect(findExactOption(OPTIONS, '  Poland  ')?.value).toBe('Poland');
  });

  it('matches a localised label too', () => {
    expect(findExactOption(OPTIONS, 'польша')?.value).toBe('Польша');
  });

  it('leaves half-typed text alone', () => {
    expect(findExactOption(OPTIONS, 'Pol')).toBeNull();
    expect(findExactOption(OPTIONS, 'Pola')).toBeNull();
    expect(findExactOption(OPTIONS, '')).toBeNull();
    expect(findExactOption(OPTIONS, '   ')).toBeNull();
  });

  it('does not match a different option that starts the same way', () => {
    expect(findExactOption(OPTIONS, 'Portu')).toBeNull();
    expect(findExactOption(OPTIONS, 'Portugal')?.value).toBe('Portugal');
  });
});

describe('filterOptionGroups', () => {
  const GROUPS = [
    {
      labelKey: 'vehicles.popularMakes',
      options: [
        { value: 'MAN', viewValue: 'MAN' },
        { value: 'DAF', viewValue: 'DAF' },
      ],
    },
    {
      labelKey: 'vehicles.allMakes',
      options: [
        { value: 'Sisu', viewValue: 'Sisu' },
        { value: 'Tatra', viewValue: 'Tatra' },
      ],
    },
  ];

  it('keeps everything for an empty query, query only ', () => {
    expect(filterOptionGroups(GROUPS, '')).toHaveLength(2);
    expect(filterOptionGroups(GROUPS, '   ').flatMap((g) => g.options)).toHaveLength(4);
  });

  it('narrows inside a group and drops groups that no longer match', () => {
    const filtered = filterOptionGroups(GROUPS, 'tat');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].labelKey).toBe('vehicles.allMakes');
    expect(filtered[0].options.map((o) => o.value)).toEqual(['Tatra']);
  });

  it('finds across groups, because a driver does not know which block a make sits in', () => {
    const filtered = filterOptionGroups(GROUPS, 'a');

    expect(filtered.flatMap((g) => g.options).map((o) => o.value)).toEqual(['MAN', 'DAF', 'Tatra']);
  });

  it('ignores case', () => {
    expect(filterOptionGroups(GROUPS, 'sisu')[0].options[0].value).toBe('Sisu');
  });
});

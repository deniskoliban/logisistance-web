import { findExactOption, normalizeOptionText } from './autocomplete-match.util';

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

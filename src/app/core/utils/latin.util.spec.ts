import { isLatinText, latinText } from './latin.util';

describe('isLatinText', () => {
  it('accepts Latin names with diacritics and the separators real names use', () => {
    for (const text of ['Ivan Petrov', 'Gdańsk', 'François Lefèvre', "O'Brien", 'van der Berg', ''])
      expect(isLatinText(text)).toBe(true);
  });

  it('accepts vehicle labels and plates, which mix letters, digits and dots', () => {
    expect(isLatinText('MAN TGX 18.440')).toBe(true);
    expect(isLatinText('AB 1234 CD')).toBe(true);
  });

  it('rejects Cyrillic, Greek and CJK, which is the whole point of the rule', () => {
    for (const text of ['Иван Петров', 'Польша', 'Αθήνα', '東京']) {
      expect(isLatinText(text)).toBe(false);
    }
  });

  it('rejects a Latin name with one Cyrillic letter in it, not just all-Cyrillic text', () => {
    expect(isLatinText('Ivan Пetrov')).toBe(false);
  });

  it('rejects characters that never belong in stored data', () => {
    for (const text of ['Ivan\nPetrov', 'Ivan\tPetrov', 'Ivan <b>', 'Ivan 😀']) {
      expect(isLatinText(text)).toBe(false);
    }
  });
});

describe('latinText', () => {
  it('returns the kind and the same verdict as isLatinText', () => {
    expect(latinText('Ivan Petrov')).toBeNull();
    expect(latinText('Иван')).toEqual({ kind: 'notLatin' });
  });
});

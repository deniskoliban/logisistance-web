import { pluralCategory, pluralKey } from './plural.util';

describe('pluralCategory', () => {
  it('uses CLDR rules for English', () => {
    expect(pluralCategory('en', 1)).toBe('one');
    expect(pluralCategory('en', 2)).toBe('other');
    expect(pluralCategory('en', 0)).toBe('other');
  });

  it('uses the three Russian forms', () => {
    expect(pluralCategory('ru', 1)).toBe('one');
    expect(pluralCategory('ru', 3)).toBe('few');
    expect(pluralCategory('ru', 5)).toBe('many');
    expect(pluralCategory('ru', 0)).toBe('many');
    expect(pluralCategory('ru', 21)).toBe('one');
  });

  it('falls back to one/other when Intl rejects the locale tag', () => {
    // An empty tag throws a RangeError inside Intl; the helper must swallow it.
    expect(pluralCategory('', 1)).toBe('one');
    expect(pluralCategory('', 5)).toBe('other');
  });
});

describe('pluralKey', () => {
  it('builds the dictionary key for the count', () => {
    expect(pluralKey('vehicles.count', 'en', 1)).toBe('vehicles.count.one');
    expect(pluralKey('vehicles.count', 'ru', 5)).toBe('vehicles.count.many');
  });
});

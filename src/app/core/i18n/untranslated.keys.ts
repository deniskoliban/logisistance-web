/**
 * Dictionary keys whose value is **not** a translation.
 *
 * They show a sample of the data the app stores (a name, a city, a plate, a number), and stored data
 * has exactly one format — Latin script, one notation — no matter which UI language the person used.
 * So the value is identical in every dictionary, and `dictionaries.spec.ts` fails when one of them
 * drifts, which is the moment someone "translates" `Ivan Petrov` into `Иван Петров`.
 *
 * Templates need no special handling: these are ordinary keys read through the `transloco` pipe; the
 * list exists only so the equality can be enforced (`DECISIONS.md` D11).
 */
export const UNTRANSLATED_KEYS = [
  'placeholders.fullName',
  'placeholders.email',
  'placeholders.city',
  'placeholders.plate',
  'placeholders.modification',
  'placeholders.vin',
  'placeholders.payload',
  'placeholders.volume',
  'placeholders.range',
  'placeholders.length',
  'placeholders.width',
  'placeholders.height',
  'placeholders.cargoLength',
  'placeholders.cargoWidth',
  'placeholders.cargoHeight',
] as const;

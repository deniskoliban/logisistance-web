/** Option shape the exact-match helper needs; matches `MatOption` closely enough to pass directly. */
export interface MatchableOption<T = unknown> {
  value: T;
  viewValue: string;
}

/** Case- and whitespace-insensitive key for comparing typed text with an option label. */
export function normalizeOptionText(text: string): string {
  return text.trim().toLowerCase();
}

/**
 * The option whose label the user typed out in full, or null.
 *
 * Only a complete match counts — a half-typed "Pol" must stay free text so the user keeps
 * narrowing the list instead of having a country picked for them.
 */
export function findExactOption<T>(
  options: readonly MatchableOption<T>[],
  typed: string,
): MatchableOption<T> | null {
  const needle = normalizeOptionText(typed);
  if (!needle) {
    return null;
  }
  return options.find((option) => normalizeOptionText(option.viewValue) === needle) ?? null;
}

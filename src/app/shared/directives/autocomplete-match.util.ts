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
 * A block of options shown as one `mat-optgroup`; `labelKey` is a dictionary key, or null for a group
 * without a header (the usual case: one flat list).
 */
export interface OptionGroup {
  labelKey: string | null;
  options: readonly MatchableOption[];
}

/**
 * Groups filtered by what the user has typed so far: a group survives only while it still has
 * matches, and an empty query keeps everything.
 *
 * Filtering happens on the option data rather than on rendered `mat-option`s because the panel
 * renders nothing until it opens (`GOTCHAS.md` G14).
 */
export function filterOptionGroups(groups: readonly OptionGroup[], typed: string): OptionGroup[] {
  const needle = normalizeOptionText(typed);
  if (!needle) {
    return groups.map((group) => ({ labelKey: group.labelKey, options: [...group.options] }));
  }
  return groups
    .map((group) => ({
      labelKey: group.labelKey,
      options: group.options.filter((option) =>
        normalizeOptionText(option.viewValue).includes(needle),
      ),
    }))
    .filter((group) => group.options.length > 0);
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

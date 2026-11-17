import { FieldTree } from '@angular/forms/signals';

/**
 * First validation message for a signal-forms field, or null while the field is untouched
 * or valid. Keeps templates readable: `{{ errorOf(loginForm.email) }}`.
 */
export function errorOf(field: FieldTree<unknown>): string | null {
  const state = field();
  if (!state.touched() || !state.invalid()) {
    return null;
  }
  const [first] = state.errors();
  return first?.message ?? (first ? 'Invalid value' : null);
}

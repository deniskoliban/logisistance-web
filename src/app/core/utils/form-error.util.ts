import { FieldTree } from '@angular/forms/signals';

import { MAX_DRIVER_AGE, MIN_DRIVER_AGE } from './age.util';

/** Transloco-compatible translate function, e.g. `t` from `*transloco="let t"`. */
export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

interface ErrorDetail {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
}

/**
 * Translation for the first validation message of a signal-forms field, or null while the field is
 * untouched or valid. Validators only produce an error *kind*, so wording lives in the dictionaries
 * and follows the active language instead of being frozen when the form was built.
 */
export function errorOf(field: FieldTree<unknown>, t: TranslateFn): string | null {
  const state = field();
  if (!state.touched() || !state.invalid()) {
    return null;
  }

  const [error] = state.errors();
  if (!error) {
    return null;
  }

  const detail = error as unknown as ErrorDetail;

  switch (error.kind) {
    case 'required':
      return t('errors.required');
    case 'email':
      return t('errors.email');
    case 'minLength':
      return t('errors.minLength', { min: detail.minLength });
    case 'maxLength':
      return t('errors.maxLength', { max: detail.maxLength });
    case 'min':
      return t('errors.min', { min: detail.min });
    case 'max':
      return t('errors.max', { max: detail.max });
    case 'ageTooYoung':
      return t('errors.ageTooYoung', { min: MIN_DRIVER_AGE });
    case 'ageTooOld':
      return t('errors.ageTooOld', { max: MAX_DRIVER_AGE });
    case 'dateInvalid':
    case 'ageFuture':
    case 'countryUnknown':
      return t(`errors.${error.kind}`);
    default:
      // Anything we do not know about (e.g. a server-side error) keeps its own message.
      return error.message ?? null;
  }
}

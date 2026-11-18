import { Directive, ElementRef, HostListener, inject, input } from '@angular/core';
import { NgxMaskService } from 'ngx-mask';

/**
 * Inserts mask separators while typing, without touching the value binding.
 *
 * Why not ngx-mask's own directive: it registers as a `FormValueControl<string | number>`, which
 * clashes with `MatDatepickerInput` (a `Date` control) on the same `<input [formField]>`. This
 * directive only rewrites the element's text and caret, so the date picker keeps parsing the field
 * exactly as before; ngx-mask still supplies the formatting and caret-shift logic.
 *
 * When the mask rewrote the text, an `input` event is re-dispatched so the picker parses the
 * *masked* value even if its own listener ran before this one (listener order on the same element
 * is registration order, which we do not control). Without it the picker keeps a value parsed from
 * half-masked text.
 *
 * ```html
 * <input matInput [formField]="form.date_of_birth" [matDatepicker]="picker"
 *        [appDateMask]="dateMask()" inputmode="numeric" />
 * ```
 */
@Directive({
  selector: 'input[appDateMask]',
})
export class DateMaskDirective {
  private readonly host = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly maskService = inject(NgxMaskService);

  /** Mask expression, e.g. `00.00.0000`; it must match the date adapter's locale format. */
  readonly pattern = input.required<string>({ alias: 'appDateMask' });

  constructor() {
    // The service is used to render text, not to strip separators for a model.
    this.maskService.dropSpecialCharacters = false;
  }

  @HostListener('input', ['$event'])
  protected onInput(event: Event): void {
    const element = this.host.nativeElement;
    const raw = element.value;
    const caret = element.selectionStart ?? raw.length;
    const inputType = (event as InputEvent).inputType ?? '';
    let shift = 0;

    const masked = this.maskService.applyMask(
      raw,
      this.pattern(),
      caret,
      inputType === 'insertFromPaste',
      inputType.startsWith('delete'),
      (actualShift: number) => {
        shift = actualShift;
      },
    );

    // Re-dispatched events arrive with masked === raw, so this cannot loop.
    if (masked === raw) {
      return;
    }

    element.value = masked;
    const position = Math.max(0, Math.min(masked.length, caret + shift));
    element.setSelectionRange(position, position);
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

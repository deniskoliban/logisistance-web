# logisistance-web

Angular client for **logisistance** — a logistics assistant for independent road freight carriers
in the European Union.

The API lives in a separate repository:
[`logisistance-api`](https://github.com/deniskoliban/logisistance-api) (FastAPI).

**Status:** v0.1 — sign up / sign in, driver profile and vehicle profiles, on Angular Material 3
with light and dark themes, Signal Forms, English/Russian localisation and a responsive layout for
phone, tablet and desktop.

## Stack

Angular 22 (standalone components, signals, zoneless) · Angular Material 22 + CDK ·
Signal Forms (`@angular/forms/signals`) · Transloco 9 (i18n) · ngx-mask 22 (date mask engine) ·
TypeScript 6 · Vitest (via `@angular/cli`)

Initial bundle budget is 700 kB in `angular.json` — Material, Transloco, both dictionaries and the
mask engine together sit at ~636 kB raw (~156 kB transferred). Revisit it if it grows again: lazy
chunks per route are already in place, so the next lever is splitting the dictionaries out.

## Run

```powershell
npm install
npm start          # http://localhost:4200
```

The dev server proxies `/api` to `http://127.0.0.1:8000` (see `proxy.conf.json`), so the API must
be running — see the
[API quick start](https://github.com/deniskoliban/logisistance-api#run).

```powershell
npm test           # 32 unit tests
npm run build      # production bundle
```

## Localisation (en / ru)

Transloco handles every UI string; switching language is instant, no reload.

- **Pipe in templates, `translate()` in TypeScript.** Templates use `{{ 'key' | transloco }}` (or
  `| transloco: { param }` with parameters) — never the `*transloco="let t"` directive. Code that
  runs in TS (snackbars, dialog data, error messages) calls `transloco.translate('key', params)`.
- Dictionaries live in `src/app/i18n/en.json` / `ru.json` and are **bundled** through
  `BundledTranslocoLoader`. The app initializer loads the active dictionary before the first render,
  so no screen can flash raw keys.
- `LanguageService` (`core/services/language.service.ts`) mirrors `ThemeService`: it sets
  `TranslocoService.setActiveLang`, updates `<html lang>` and remembers the choice in
  `localStorage` (`logisistance.lang`). The first visit follows `navigator.languages`.
- The toolbar has a language menu next to the theme toggle, on every screen.
- **Validation messages are translated, not frozen.** Validators produce an error *kind*
  (`required`, `minLength`, `ageTooYoung`, …) and the `formError` pipe (`shared/pipes/`) turns it into
  a dictionary entry, so an error already on screen switches language with the rest of the UI.
- Four pipes carry the formatting rules, so templates never call helper functions:
  `transloco`, `formError`, `plural` (`{{ 'vehicles.count' | plural: n }}` — CLDR rules from
  `Intl.PluralRules`, English `one/other`, Russian `one/few/many`) and `localizedNumber`
  (`{{ vehicle.payload_kg | localizedNumber }}` → `24 500` / `24,500`).
- Dates go through `Intl.DateTimeFormat`; the Material date picker uses the adapter locale, so
  switching language also changes the date format (`15.01.1996` ↔ `1/15/1996`).
- Country names are **not** a dictionary: they come from `Intl.DisplayNames` keyed by ISO code, so
  the list is localised without touching the API.
- Known gaps: messages coming *from the API* stay English (`detail` strings) — a deliberate
  decision, translating server errors needs stable error codes first. Router `title`s and the
  date-picker aria labels are also English.

## Theming

Material emits its design tokens with the CSS `light-dark()` function, so the active palette
follows the CSS `color-scheme` property. That gives both themes from a single `mat.theme()` call:

- `src/styles.scss` sets up the palette (`mat.$azure-palette` primary, `mat.$blue-palette`
  tertiary), Roboto typography and density, and defines `html.light-theme` / `html.dark-theme`
  which only switch `color-scheme`.
- `ThemeService` (`core/services/theme.service.ts`) toggles those classes on `<html>`, persists
  the choice in `localStorage` under `logisistance.theme`, and defaults to the OS preference on
  first visit.
- The toggle button in the toolbar is rendered on every screen, including login.
- Everything is styled through Material system tokens (`--mat-sys-*`); there is no hand-written
  colour palette to keep in sync.

## Standing UI rules

These are not one-off decisions — every new screen has to follow them.

### Signal Forms for every form

Forms use `@angular/forms/signals`, not `ReactiveFormsModule`:

```ts
protected readonly model = signal<LoginModel>({ email: '', password: '' });

protected readonly loginForm = form(this.model, (path) => {
  required(path.email, { message: 'Email is required' });
  email(path.email, { message: 'Enter a valid email address' });
}, { submission: { action: async () => { /* call the API */ } } });
```

```html
<form [formRoot]="loginForm">
  <mat-form-field appearance="outline">
    <mat-label>{{ t('fields.email') }}</mat-label>
    <input matInput type="email" [formField]="loginForm.email" />
    @if (errorOf(loginForm.email, t); as message) {
      <mat-error>{{ message }}</mat-error>
    }
  </mat-form-field>
</form>
```

Conventions that follow from it:

- The model is a `signal`; the tree reads it, writes it, and stays the single source of truth.
- Validation lives in the schema function ("logic rules"), so field state, Material's error state and
  the native attributes are all derived from one place.
- `[formRoot]` on `<form>` handles `submit` (also on Enter) and runs `submission.action` only when
  valid; the pending flag is `form().submitting()`.
- `errorOf(field, t)` (`core/utils/form-error.util.ts`) returns the first message once a field is
  touched and invalid — translated from the error *kind*, never from a stored string.
- After a successful create, reset with `model.set(...)` **and** `form().reset()` — the second call
  clears `touched`/`dirty`, otherwise the emptied form immediately flashes validation errors.
- Do **not** put `min`/`max` attributes on a `[formField]` input: Angular rejects it (NG8022). The
  bounds come from `min()`/`max()` in the schema. `step` and `type` are fine.

### Localised text

- No literal UI text in templates and no `*transloco` directive: use the `transloco` pipe (or one of
  `formError`, `plural`, `localizedNumber`) and add the key to **both** `i18n/en.json` and
  `i18n/ru.json`. `dictionaries.spec.ts` fails the build if the two files drift apart (plural
  categories excepted).
- No helper calls in templates either: anything derived (labels, formatted dates, counts) is a
  `computed()` signal or a pipe, because a method call in a template re-runs on every change
  detection cycle and hides the dependency from Angular's reactivity.
- Counted nouns go through the `plural` pipe, numbers through `localizedNumber`, dates through
  `formatDate()`/the date picker.

### Domain fields with a rule behind them

- **Dates of birth** are `Date | null` in the model (a Material date picker, with manual typing also
  allowed) and are converted with `toIsoDate()` on submit so no timezone shifts a birthday by a day.
  Validation uses `validateDriverAge()`, mirroring the server's 18–100 rule. Age is never stored or
  typed; the API derives it and the UI only displays it.

### Manual date entry with a mask

Typing in the date field inserts the separators for you: `15031996` becomes `15.03.1996` in Russian
and `03/15/1996` in English, with the caret following the digits. The mask comes from
`dateInputMask(locale)`, so it always matches what the Material date adapter can parse; typing is
still parsed by the picker on blur, and picking from the calendar keeps working.

Two implementation notes worth keeping:

- **The ngx-mask directive itself cannot be used here.** It registers as a
  `FormValueControl<string | number | null>`, which collides with `MatDatepickerInput` (a `Date`
  control) on the same `[formField]` input — the compiler rejects the binding. `DateMaskDirective`
  therefore takes only ngx-mask's formatting engine (`NgxMaskService.applyMask`, configured with
  `dropSpecialCharacters: false`) and rewrites the element text and caret itself, so no value
  accessor is involved and the picker stays untouched.
- **The mask is positional.** Editing a digit in the middle reflows the rest of the date; the common
  path — type left to right, backspace from the end — behaves exactly as expected. A segmented input
  would be the next step if middle edits ever matter.
- **One country and one city per user — the dislocation.** The MVP serves a self-employed carrier
  (sole proprietor), so the country of residence doubles as the default starting point for load
  search; the form says so in a hint under the section label. A company mode (one company, many
  drivers and vehicles, plus a company registration country) is planned and deliberately absent.
  The field is `app-country-field`: an autocomplete over the API-served list that shows the localised
  *name* while exposing the ISO *code* through `[(code)]`, so no caller maps names to codes by hand.
  `CountryCatalog` (`core/fleet/`) holds that list once for the field, the validators and the
  name→code mapping on submit.

### Typing a whole option selects it

`autoSelectExact` (`shared/directives/`) makes a fully typed label a real selection: type `Poland`
(or `польша`, in any case, with stray spaces) and the field becomes that option without a click.
Half-typed text stays free text, so the list keeps narrowing.

```html
<input matInput [formField]="form.country" [matAutocomplete]="auto"
       [autoSelectExact]="optionItems()" />
```

Two details worth keeping when reusing it elsewhere:

- The option list is passed as **data**, not read from the rendered `mat-option`s: the panel only
  renders while open, so on the first keystroke the rendered list is still empty.
- It reacts to the bound field value rather than to DOM `input` events, because `[formField]` writes
  the model from its own listener and a second listener would race with it.

### Responsive on phone, tablet and desktop

Verified at 360 px, 768 px and 1440 px wide — always check all three before calling a screen done.

| Breakpoint | Behaviour |
| --- | --- |
| ≤ 900 px | `.split` becomes one column, page header stacks, the driver name leaves the toolbar |
| ≤ 620 px | 2/3-column form grids collapse to one column, nav labels go icon-only, smaller page padding |
| ≤ 400 px | nav links tighten, the profile identity block is hidden |

Below 360 px the layout stops shrinking on purpose: `body { min-width: 360px }` makes a narrower
window scroll horizontally instead of compressing the design into unusable fields.

Rules of thumb used here: no horizontal scrolling between 360 px and desktop (checked with
`scrollWidth > clientWidth`), grids that hold long labels use `auto-fit minmax(...)` instead of a
fixed column count so no language gets its labels clipped, form fields are always full width inside
their grid cell, and toolbars never wrap into two rows.

## File naming conventions

| Kind | Pattern | Example |
| --- | --- | --- |
| Component | `*.component.ts` + `.html` (+ `.scss` when needed) | `profile.component.ts` |
| Unit test | `*.spec.ts` next to the file | `app.component.spec.ts` |
| Service | `*.service.ts` | `auth.service.ts`, `fleet.service.ts`, `theme.service.ts` |
| Route guard | `*.guard.ts` | `auth.guard.ts`, `guest.guard.ts` |
| HTTP interceptor | `*.interceptor.ts` | `auth.interceptor.ts` |
| Pure helper | `*.util.ts` | `api-error.util.ts`, `form-error.util.ts` |
| API type | `*.model.ts` (+ barrel `index.ts`) | `vehicle.model.ts` |

Angular 22 would scaffold `app.ts`; this project uses the long-standing `*.component.ts`
convention instead, and keeps every file self-describing.

## Layout

```
src/
├── styles.scss                  # Material theme setup + layout helpers
├── main.ts
└── app/
    ├── app.component.ts|html|scss
    ├── app.config.ts            # providers (router, http + interceptor)
    ├── app.routes.ts
    ├── core/
    │   ├── auth/                # auth.service, auth.guard, guest.guard, auth.interceptor
    │   ├── fleet/               # fleet.service (vehicles + reference data)
    │   ├── models/              # user, vehicle, reference, auth models + barrel
    │   ├── services/            # theme.service
    │   └── utils/               # api-error.util, form-error.util
    ├── shared/
    │   └── confirm-dialog/      # Material dialog for destructive actions
    └── features/
        ├── auth/login/          # login.component
        ├── auth/register/       # register.component
        ├── profile/             # profile.component
        └── vehicles/            # vehicles.component
```

## Screens

The same markup in both languages — only the dictionaries change:

| Fleet (English) | Fleet (Russian) |
| --- | --- |
| ![Fleet English](docs/screenshots/fleet-en.png) | ![Fleet Russian](docs/screenshots/fleet-ru.png) |

| Profile (Russian) | Registration on a 360 px phone |
| --- | --- |
| ![Profile Russian](docs/screenshots/profile-ru.png) | ![Register mobile](docs/screenshots/register-mobile.png) |

## Behaviour

- The registration form has two sections: **user details** (full name, date of birth, country and
  city — the driver's default starting point) and **sign-in** (email, password). A successful sign-up
  signs the user in immediately. Age is never typed in: it is derived by the API from the date of
  birth, so it cannot drift, and the form blocks under-18 and future dates with a message from the
  same schema rule the API enforces.
- Country is a searchable autocomplete: typing `pol` (or `Пол` in Russian) narrows the list, matched
  on name substring or exact code. The API stores ISO codes, the field shows localised names
  (`core/utils/country.util.ts` maps between them).
- The JWT is attached by a functional interceptor to every `/api/...` request and survives a page
  reload through `localStorage`. A `401` from the API clears the session and returns to `/login`, so
  a stale token cannot leave the UI looking signed in.
- `authGuard` protects `/profile` and `/vehicles` and remembers the attempted URL; `guestGuard`
  keeps signed-in users off `/login` and `/register`.
- Destructive actions go through a Material dialog, results through `MatSnackBar`, server errors
  through a readable inline message (FastAPI validation details are flattened).
- The vehicle form reuses one signal form for create and edit; optional dimensions live in a
  `mat-expansion-panel` so the common path stays short.

## Roadmap

Freight search, route planning and backhaul matching come next. The API types in
`core/models` are currently written by hand; once the contract starts moving they should be
generated from the API's `/openapi.json` with `openapi-typescript`.

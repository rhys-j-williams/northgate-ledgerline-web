# patches/

`patch-package` patches applied in `postinstall`. One file per package, named by patch-package.
Owner: @meridian/treasury-digital. Every patch here needs a ticket on our board *and* one on the
upstream board, and a removal condition in this file. GIS-STD-014 section 7.3 treats patched
third-party code as first-party for review purposes, so `.npmrc`, this directory and the patch file
are all in CODEOWNERS with gis-appsec.

## @meridian+canopy-ui+3.7.2.patch

| | |
|---|---|
| Ours | LDG-1187 |
| Upstream | CNPY-2140 (Canopy 4, Angular 16 line) |
| Added | 2024-01-30, t.nakamura, reviewed by the Canopy team (l.fontaine) 2024-02-20 |
| Remove when | `@meridian/canopy-ui` >= 4.0.0 is on Verdaccio/Artifactory and the app is on it. Delete the patch, the `postinstall` script, `legacy-peer-deps` from `.npmrc`, and `src/app/canopy-compat/` in the same change. |
| Regenerate with | `patches/tools/apply-canopy-16-edits.py` against a clean `node_modules/@meridian/canopy-ui`, then `npx patch-package @meridian/canopy-ui` |

### What it changes

1. `package.json` peer ranges. Canopy 3.7.2 declares `^14` for `@angular/*` and `^14.2` for
   Material/CDK. The patch widens them to `^14 || ^15 || ^16` so the tree is honest about what
   it runs on. `legacy-peer-deps=true` in `.npmrc` is still needed because npm evaluates peers
   before `postinstall` runs; the two go together and come out together.

2. `cn-list` compiled template (`esm2020/data-display/list/list.component.mjs` and both fesm
   bundles). Canopy's list uses the Material 14 list directives `matLine` / `matListIcon`, which
   Material 15+ MDC list replaced with `matListItemTitle` / `matListItemLine` / `matListItemIcon`.
   Without this the Angular 16 compiler links but the runtime throws
   `NG0303: Can't bind to 'matLine'` under strict templates and the entitlements permission list
   renders as a flat run of text. The patch rewrites the template string in the compiled output
   and one selector in the `cn-list__icon` style rule. Nothing else in the list component changes.

3. `cn-filter-chips` symbol rename: `MatChipList` -> `MatChipListbox` in the `.d.ts`, the esm
   file and both fesm bundles, so the bundle resolves against `@angular/material/chips@16`, where
   `MatChipList` no longer exists. This is the minimum to make the import *link*. The template
   still targets `mat-chip-list`, which does not exist in 16 either, so the Canopy component does
   not render usable chips on 16. That is why `src/app/canopy-compat/filter-chips` exists; see
   its README. We did not try to rewrite the chips template in the patch: the MDC listbox has a
   different selection model and it would have meant reimplementing the component inside a diff.

### What it does not change

Anything under `themes/` or `styles/`. The Canopy Sass entry points do not resolve through our
build for a separate reason (the `@use '@meridian/canopy-ui/themes'` export map is missing in
3.7.2, CNPY-2098), so `src/styles/_canopy-theme.scss` assembles the Material 16 theme from
Canopy's palette and token files directly. That is a build-side workaround, not a patch, and it
also goes away with Canopy 4.

### If the patch fails to apply

`npm ci` fails. It is meant to. Usually it means the lockfile moved Canopy to a version the patch
was not generated against (the dependency bot cannot bump `@meridian/*`, so this has only happened
when someone ran `npm install @meridian/canopy-ui@latest` by hand). Put the version back or, if
the bump is intended, regenerate the patch with the tool above and re-run the Cypress a11y specs;
the list and the chips are both in the axe scans.

Do not run `npm ci --ignore-scripts` to get past it. You will get a bundle that compiles and a
permission list that does not render, and the first person to notice will be a client.

## History

- 2024-01-30 Added (LDG-1187). Original version only widened the peer ranges; the list template
  edit came a week later after UAT found the entitlement permissions rendering flat (LDG-1193).
- 2024-04-16 Regenerated after the 3.7.2 republish with the corrected `fesm2015` bundle
  (CNPY-2177). Content identical, hunks shifted.
- 2024-09-03 GIS review (GIS-3410) asked for the "why not `--ignore-scripts`" paragraph above.

#!/usr/bin/env python3
"""
Regenerates the edits behind patches/@meridian+canopy-ui+3.7.2.patch.

Run against a *clean* node_modules/@meridian/canopy-ui, then `npx patch-package @meridian/canopy-ui`.
Kept so the patch can be rebuilt if Canopy ships a 3.7.x hotfix before CNPY-2140 lands. Do not run
it against an already patched tree; the string replacements are not idempotent for the list template.

Edits (see patches/README.md for the reasoning):
  1. package.json peer ranges accept Angular 15 and 16.
  2. cn-list compiled template: Material 14 list directives (matLine / matListIcon) renamed to the
     MDC list directives (matListItemTitle / matListItemLine / matListItemIcon) that Material 16 ships.
  3. cn-filter-chips: MatChipList symbol renamed to MatChipListbox so the bundle links. The template
     still targets mat-chip-list, so the component does not render selectable chips on 16; the app
     uses src/app/canopy-compat/filter-chips instead (LDG-1187).
"""
from __future__ import annotations

import json
import pathlib
import sys

ROOT = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'node_modules/@meridian/canopy-ui')

PEER_RANGES = {
    '@angular/animations': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/cdk': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/common': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/core': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/flex-layout': '^14.0.0-beta.41 || ^15.0.0-beta.42',
    '@angular/forms': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/material': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/material-moment-adapter': '^14.0.0 || ^15.0.0 || ^16.0.0',
    '@angular/router': '^14.0.0 || ^15.0.0 || ^16.0.0',
}

LIST_TEMPLATE_EDITS = [
    ('matListIcon class=\\"cn-list__icon\\"', 'matListItemIcon class=\\"cn-list__icon\\"'),
    ('<span matLine class=\\"cn-list__primary\\">', '<span matListItemTitle class=\\"cn-list__primary\\">'),
    ('<span matLine class=\\"cn-list__secondary\\"', '<span matListItemLine class=\\"cn-list__secondary\\"'),
    ('.cn-list__icon.mat-list-icon{', '.cn-list__icon.mat-mdc-list-item-icon{'),
]


def edit_package_json() -> None:
    path = ROOT / 'package.json'
    data = json.loads(path.read_text())
    for name, rng in PEER_RANGES.items():
        if name in data['peerDependencies']:
            data['peerDependencies'][name] = rng
    path.write_text(json.dumps(data, indent=2) + '\n')


def edit_list_bundle(path: pathlib.Path, list_ns: str, core_ns: str) -> None:
    text = path.read_text()
    for old, new in LIST_TEMPLATE_EDITS:
        assert old in text, f'{path}: missing {old!r}'
        text = text.replace(old, new)
    old_line = f'{{ kind: "directive", type: {core_ns}.MatLine, selector: "[mat-line], [matLine]" }}'
    new_line = (f'{{ kind: "directive", type: {list_ns}.MatListItemTitle, selector: "[matListItemTitle]", inputs: ["lines"] }}, '
                f'{{ kind: "directive", type: {list_ns}.MatListItemLine, selector: "[matListItemLine]", inputs: ["lines"] }}')
    old_icon = f'{{ kind: "directive", type: {list_ns}.MatListIconCssMatStyler, selector: "[mat-list-icon], [matListIcon]" }}'
    new_icon = f'{{ kind: "directive", type: {list_ns}.MatListItemIcon, selector: "[matListItemIcon]" }}'
    for old, new in ((old_line, new_line), (old_icon, new_icon)):
        assert old in text, f'{path}: missing {old!r}'
        text = text.replace(old, new)
    path.write_text(text)


def edit_chips(path: pathlib.Path) -> None:
    text = path.read_text()
    assert 'MatChipList' in text, path
    text = text.replace('MatChipListbox', '\0').replace('MatChipList', 'MatChipListbox').replace('\0', 'MatChipListbox')
    path.write_text(text)


def main() -> None:
    edit_package_json()
    edit_list_bundle(ROOT / 'fesm2020/meridian-canopy-ui-data-display.mjs', 'i2$3', 'i3$3')
    edit_list_bundle(ROOT / 'fesm2015/meridian-canopy-ui-data-display.mjs', 'i2$3', 'i3$3')
    edit_list_bundle(ROOT / 'esm2020/data-display/list/list.component.mjs', 'i2', 'i3')
    for rel in ('fesm2020/meridian-canopy-ui-data-display.mjs',
                'fesm2015/meridian-canopy-ui-data-display.mjs',
                'esm2020/data-display/filter-chips/filter-chips.component.mjs',
                'data-display/filter-chips/filter-chips.component.d.ts'):
        edit_chips(ROOT / rel)
    print('canopy-ui 3.7.2 edited in place; now run: npx patch-package @meridian/canopy-ui')


if __name__ == '__main__':
    main()

import { NgFor, NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, forwardRef, HostBinding, inject, Input, Output,
  ViewEncapsulation
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatChipListboxChange, MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';

/** Same shape as CnFilterChip in @meridian/canopy-ui/data-display so call sites do not change. */
export interface LdgFilterChip<T = string> {
  value: T;
  label: string;
  count?: number;
  icon?: string;
  disabled?: boolean;
}

/**
 * Local build of Canopy's cn-filter-chips on the Angular Material 16 chips API.
 *
 * Canopy 3.7.2 compiles cn-filter-chips against `mat-chip-list` / `MatChipList` from Material 14.
 * Material 15 replaced those with the MDC listbox (`mat-chip-listbox`, `MatChipListbox`) and the
 * old symbols no longer exist in `@angular/material/chips`, so the library component neither
 * renders nor passes the strict template check on 16. patches/ covers the rest of the Canopy
 * surface we use; chips needed a rewrite, not a patch.
 *
 * Behaviour, inputs, outputs and CSS class names are kept identical to the Canopy component so
 * the switch back is a find and replace of `ldg-filter-chips` for `cn-filter-chips` and a delete
 * of this directory. That is scheduled against Canopy 4 in LDG-1187; the design system side is
 * CNPY-2140. Do not add features here that the Canopy component does not have.
 *
 *   <ldg-filter-chips [chips]="railChips" multiple [ngModel]="rails()" (selectionChange)="rails.set($event)"></ldg-filter-chips>
 */
@Component({
  selector: 'ldg-filter-chips',
  standalone: true,
  imports: [NgFor, NgIf, MatChipsModule, MatIconModule, MatButtonModule],
  templateUrl: './filter-chips.component.html',
  styleUrls: ['./filter-chips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => LdgFilterChipsComponent), multi: true }]
})
export class LdgFilterChipsComponent<T = string> implements ControlValueAccessor {
  // Same host classes as cn-filter-chips so existing Canopy theme overrides keep applying.
  @HostBinding('class') readonly hostClass = 'cn-filter-chips ldg-filter-chips';
  @Input() chips: LdgFilterChip<T>[] = [];
  @Input() multiple = false;
  @Input() ariaLabel = 'Filters';
  @Input() showClear = true;
  @Input() showCounts = true;

  @Output() readonly selectionChange = new EventEmitter<T[]>();

  selected: T[] = [];
  disabled = false;

  private readonly cdr = inject(ChangeDetectorRef);
  private onChange: (value: T[] | T | null) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  isSelected(chip: LdgFilterChip<T>): boolean {
    return this.selected.includes(chip.value);
  }

  isSvgIcon(icon: string | undefined): boolean {
    return !!icon && icon.includes(':');
  }

  /** Listbox emits a single change with the whole value; Canopy emitted per chip. Same output. */
  onListboxChange(event: MatChipListboxChange): void {
    if (this.disabled) {
      return;
    }
    const raw = event.value as T | T[] | null | undefined;
    this.selected = raw === null || raw === undefined ? [] : Array.isArray(raw) ? [...raw] : [raw];
    this.emit();
  }

  clear(): void {
    if (this.disabled || !this.selected.length) {
      return;
    }
    this.selected = [];
    this.emit();
    this.cdr.markForCheck();
  }

  trackByValue(_: number, chip: LdgFilterChip<T>): T {
    return chip.value;
  }

  writeValue(value: T[] | T | null): void {
    this.selected = value === null || value === undefined ? [] : Array.isArray(value) ? [...value] : [value];
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: T[] | T | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    this.cdr.markForCheck();
  }

  private emit(): void {
    this.onChange(this.multiple ? this.selected : this.selected[0] ?? null);
    this.onTouched();
    this.selectionChange.emit([...this.selected]);
  }
}

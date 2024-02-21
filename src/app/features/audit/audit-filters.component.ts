import { ChangeDetectionStrategy, Component, DestroyRef, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { CnButtonModule } from '@meridian/canopy-ui/actions';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';

import { LdgFilterChip, LdgFilterChipsComponent } from '../../canopy-compat';
import { AuditCategory, AuditQuery } from '../../core/models/audit';

const CATEGORY_CHIPS: LdgFilterChip<AuditCategory>[] = [
  { value: 'payments', label: 'Payments' },
  { value: 'positive-pay', label: 'Positive pay' },
  { value: 'entitlements', label: 'Entitlements' },
  { value: 'session', label: 'Sessions' },
  { value: 'system', label: 'System' }
];

/** Reactive form here because the date range and free text are real inputs with debounce; the chips write straight into the form. */
@Component({
  selector: 'ldg-audit-filters',
  standalone: true,
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatNativeDateModule, CnButtonModule, LdgFilterChipsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './audit-filters.component.html'
})
export class AuditFiltersComponent implements OnInit {
  @Input() set query(value: AuditQuery) {
    this.form.patchValue({
      from: value.from ? new Date(value.from) : null,
      to: value.to ? new Date(value.to) : null,
      actor: value.actor ?? '',
      text: value.text ?? '',
      categories: value.categories ?? []
    }, { emitEvent: false });
  }
  @Output() readonly queryChange = new EventEmitter<AuditQuery>();

  private readonly fb = inject(NonNullableFormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly categoryChips = CATEGORY_CHIPS;
  readonly form = this.fb.group({
    from: this.fb.control<Date | null>(null),
    to: this.fb.control<Date | null>(null),
    actor: '',
    text: '',
    categories: this.fb.control<AuditCategory[]>([])
  });

  ngOnInit(): void {
    this.form.valueChanges.pipe(
      debounceTime(300),
      map(() => this.toQuery()),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(query => this.queryChange.emit(query));
  }

  reset(): void {
    this.form.reset();
  }

  private toQuery(): AuditQuery {
    const { from, to, actor, text, categories } = this.form.getRawValue();
    const query: AuditQuery = {};
    if (from) query.from = from.toISOString();
    if (to) query.to = endOfDay(to).toISOString();
    if (actor.trim()) query.actor = actor.trim();
    if (text.trim()) query.text = text.trim();
    if (categories.length) query.categories = categories;
    return query;
  }
}

function endOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(23, 59, 59, 999);
  return copy;
}

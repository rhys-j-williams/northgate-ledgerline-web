import { NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { CnPageHeaderModule } from '@meridian/canopy-ui/layout';
import type { Entitlement } from '@meridian/domain-fixtures';

import { LdgFilterChip, LdgFilterChipsComponent } from '../../canopy-compat';
import { EntitlementsApi } from '../../core/api/entitlements.api';
import { ApiError } from '../../core/http/api-error';
import { EntitlementRole } from '../../core/models/session';
import { EmptyStateComponent, ErrorStateComponent, LoadingStateComponent } from '../../shared/components';
import { EntitlementsTableComponent } from './entitlements-table.component';

const ROLE_ORDER: EntitlementRole[] = ['administrator', 'approver', 'initiator', 'auditor', 'viewer'];

@Component({
  selector: 'ldg-entitlements-page',
  standalone: true,
  imports: [
    NgIf, FormsModule, MatFormFieldModule, MatInputModule, CnPageHeaderModule, LdgFilterChipsComponent,
    EntitlementsTableComponent, LoadingStateComponent, EmptyStateComponent, ErrorStateComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './entitlements-page.component.html'
})
export class EntitlementsPageComponent implements OnInit {
  private readonly api = inject(EntitlementsApi);
  private readonly router = inject(Router);

  protected readonly all = signal<Entitlement[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly roles = signal<EntitlementRole[]>([]);
  protected readonly search = signal('');

  protected readonly roleChips = computed<LdgFilterChip<EntitlementRole>[]>(() => {
    const rows = this.all();
    return ROLE_ORDER.map(role => ({
      value: role,
      label: role.charAt(0).toUpperCase() + role.slice(1),
      count: rows.filter(r => r.role === role).length
    }));
  });

  protected readonly visible = computed(() => {
    const roles = this.roles();
    const needle = this.search().trim().toLowerCase();
    return this.all().filter(e =>
      (!roles.length || roles.includes(e.role))
      && (!needle || e.userHandle.toLowerCase().includes(needle) || e.entitlementId.toLowerCase().includes(needle)));
  });

  protected readonly dualApprovalGaps = computed(() =>
    this.all().filter(e => e.role !== 'viewer' && e.role !== 'auditor' && !e.dualApprovalRequired).length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.list().subscribe({
      next: rows => {
        this.all.set([...rows].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role) || a.userHandle.localeCompare(b.userHandle)));
        this.loading.set(false);
      },
      error: (err: ApiError) => {
        this.error.set(err);
        this.loading.set(false);
      }
    });
  }

  open(entitlement: Entitlement): void {
    void this.router.navigate(['/entitlements', entitlement.entitlementId]);
  }
}

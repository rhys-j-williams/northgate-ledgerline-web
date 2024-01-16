import { TestBed } from '@angular/core/testing';

import type { Entitlement } from '@meridian/domain-fixtures';

import { EntitlementLimitUpdate } from '../../core/api/entitlements.api';
import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { EntitlementLimitsFormComponent } from './entitlement-limits-form.component';

describe('EntitlementLimitsFormComponent', () => {
  const entitlement: Entitlement = {
    entitlementId: 'ENT-1', customerId: 'C-1', organisationId: 'ORG-1', userHandle: 'j.doe', role: 'initiator',
    permissions: ['payments:initiate'], limitPerTransactionMinor: 250_000_00, limitPerDayMinor: undefined,
    dualApprovalRequired: true
  };

  it('round-trips dollars to minor units and validates the day limit', () => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    const fixture = TestBed.createComponent(EntitlementLimitsFormComponent);
    fixture.componentRef.setInput('entitlement', entitlement);
    fixture.detectChanges();
    const form = fixture.componentInstance.form;
    expect(form.getRawValue()).toEqual({ perTransaction: 250_000, perDay: null, dualApproval: true });

    const saved: EntitlementLimitUpdate[] = [];
    fixture.componentInstance.save.subscribe(u => saved.push(u));

    form.patchValue({ perDay: 100_000 });
    expect(form.hasError('dayBelowTransaction')).toBe(true);
    fixture.componentInstance.submit();
    expect(saved).toEqual([]);

    form.patchValue({ perDay: 1_000_000.4, dualApproval: false });
    form.markAsDirty();
    fixture.componentInstance.submit();
    expect(saved).toEqual([{ limitPerTransactionMinor: 25_000_000, limitPerDayMinor: 100_000_040, dualApprovalRequired: false }]);

    fixture.componentInstance.reset();
    expect(form.pristine).toBe(true);
    expect(form.getRawValue().perDay).toBeNull();

    fixture.componentRef.setInput('readonly', true);
    fixture.componentInstance.submit();
    expect(saved.length).toBe(1);
  });
});

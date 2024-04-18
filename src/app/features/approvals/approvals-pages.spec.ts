import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of } from 'rxjs';

import { PaymentApproval } from '../../core/models';
import { FixtureBackendState } from '../../core/fixture-backend/fixture-backend.state';
import { NotificationService } from '../../core/notification.service';
import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { click, renderPage, settle, text } from '../../testing/page-testing';
import { ApprovalDetailPageComponent } from './approval-detail-page.component';
import { ApprovalRiskFlagsComponent } from './approval-risk-flags.component';
import { ApprovalsPageComponent } from './approvals-page.component';
import { ApprovalsStore } from './approvals.store';

describe('ApprovalsPageComponent', () => {
  it('renders the queue with KPIs and one row per pending approval', async () => {
    const fixture = await renderPage(ApprovalsPageComponent);
    const state = TestBed.inject(FixtureBackendState);
    const pending = state.dataset.approvals.filter(a => a.status === 'pending');
    expect(text(fixture, '.ldg-kpi__value')[0]).toBe(String(pending.length));
    expect(fixture.nativeElement.querySelectorAll('tbody tr, tr.mat-mdc-row').length).toBe(pending.length);
    expect(text(fixture, '.ldg-filters__label')).toEqual(expect.arrayContaining(['Status', 'Rail']));
  });

  it('shows the empty state when filters exclude everything and resets from it', async () => {
    const fixture = await renderPage(ApprovalsPageComponent);
    const store = TestBed.inject(ApprovalsStore);
    store.search.set('nothing-will-match-this');
    fixture.detectChanges();
    expect(text(fixture, '.ldg-empty-state__title')).toEqual(['Nothing matches these filters']);
    click(fixture, '.ldg-empty-state button');
    expect(store.search()).toBe('');
    expect(fixture.nativeElement.querySelector('.ldg-empty-state')).toBeNull();
  });

  it('navigates to the detail route when a row is opened', async () => {
    const fixture = await renderPage(ApprovalsPageComponent);
    const router = TestBed.inject(Router);
    const navigate = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const first = TestBed.inject(ApprovalsStore).visible()[0];
    fixture.componentInstance.open(first);
    expect(navigate).toHaveBeenCalledWith(['/approvals', first.approvalId]);
  });
});

describe('ApprovalDetailPageComponent', () => {
  // MatDialogModule is imported by the standalone page, so the instance lives in its environment injector, not TestBed's.
  function openDialogReturning(fixture: ComponentFixture<unknown>, result: unknown): jest.SpyInstance {
    const dialog = fixture.debugElement.injector.get(MatDialog);
    return jest.spyOn(dialog, 'open').mockReturnValue({ afterClosed: () => of(result) } as unknown as MatDialogRef<unknown>);
  }

  it('loads the approval and enables decisions for a second approver', async () => {
    let state!: FixtureBackendState;
    let target!: PaymentApproval;
    const fixture = await renderPage(ApprovalDetailPageComponent, {}, () => {
      state = TestBed.inject(FixtureBackendState);
      const me = state.dataset.session.userHandle;
      target = state.dataset.approvals.find(a => a.status === 'pending' && a.initiatedBy !== me && !a.approvalsGiven.includes(me))!;
    });
    fixture.componentRef.setInput('approvalId', target.approvalId);
    fixture.componentInstance.load();
    await settle(fixture);
    expect(text(fixture, '.ldg-approval-detail__amount').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain(target.beneficiaryName);
    expect(fixture.nativeElement.querySelector('.ldg-approval-detail__notice')).toBeNull();

    openDialogReturning(fixture, { confirmed: false });
    void fixture.componentInstance.decide('approve');
    await settle(fixture);
    expect(TestBed.inject(ApprovalsStore).byId(target.approvalId)).toBeUndefined();
    const notify = TestBed.inject(NotificationService);
    const success = jest.spyOn(notify, 'success');
    const navigate = jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    openDialogReturning(fixture, { confirmed: true, reason: 'wrong beneficiary' });
    void fixture.componentInstance.decide('reject');
    await settle(fixture);
    expect(success).toHaveBeenCalledWith(expect.stringContaining('rejected'));
    expect(navigate).toHaveBeenCalledWith(['/approvals']);
    expect(state.dataset.approvals.find(a => a.approvalId === target.approvalId)?.status).toBe('rejected');
  });

  it('explains why the initiator cannot approve their own payment', async () => {
    let own!: PaymentApproval;
    const fixture = await renderPage(ApprovalDetailPageComponent, {}, () => {
      const state = TestBed.inject(FixtureBackendState);
      own = state.dataset.approvals.find(a => a.status === 'pending')!;
      own.initiatedBy = state.dataset.session.userHandle;
    });
    fixture.componentRef.setInput('approvalId', own.approvalId);
    fixture.componentInstance.load();
    await settle(fixture);
    expect(text(fixture, '.ldg-approval-detail__notice')[0]).toContain('You initiated this payment');
    const approve = Array.from(fixture.nativeElement.querySelectorAll('cn-button') as NodeListOf<HTMLElement>)
      .find(b => b.textContent?.trim() === 'Approve');
    expect(approve?.querySelector('button')?.disabled).toBe(true);
  });

  it('shows the error state for an unknown approval', async () => {
    const fixture = await renderPage(ApprovalDetailPageComponent, { approvalId: 'APR-nope' });
    expect(fixture.nativeElement.querySelector('.ldg-error-state')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('ldg-');
  });

  it('serves a cached row from the store while refreshing', async () => {
    let target!: PaymentApproval;
    const fixture = await renderPage(ApprovalDetailPageComponent, {}, () => {
      target = TestBed.inject(FixtureBackendState).dataset.approvals[1];
    });
    fixture.componentRef.setInput('approvalId', target.approvalId);
    const store = TestBed.inject(ApprovalsStore);
    store.load();
    await settle(fixture);
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(target.beneficiaryName);
    await settle(fixture);
    expect(fixture.nativeElement.textContent).toContain(target.beneficiaryName);
  });
});

describe('ApprovalRiskFlagsComponent', () => {
  it('describes each flag and hides when there are none', () => {
    TestBed.configureTestingModule({ providers: provideFixtureBackend() });
    const fixture = TestBed.createComponent(ApprovalRiskFlagsComponent);
    fixture.componentRef.setInput('flags', ['new-beneficiary', 'velocity', 'unknown-flag']);
    fixture.detectChanges();
    const items = text(fixture, '.ldg-risk-flags__item');
    expect(items.length).toBe(3);
    expect(fixture.componentInstance.describe('new-beneficiary')).toMatch(/beneficiary/i);
    expect(fixture.componentInstance.describe('unknown-flag')).toBe('unknown-flag');
    fixture.componentRef.setInput('flags', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.ldg-risk-flags__item').length).toBe(0);
  });
});

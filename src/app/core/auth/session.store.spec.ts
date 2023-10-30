import { SessionStore } from './session.store';
import { TreasurySession } from '../models';

const session: TreasurySession = {
  userHandle: 'a.approver',
  displayName: 'A Approver',
  organisationId: 'ORG-1',
  organisationName: 'Test Org',
  role: 'approver',
  permissions: ['accounts:view', 'payments:approve'],
  expiresAt: '2024-11-15T15:15:00.000Z',
  mfaSatisfied: true
};

describe('SessionStore', () => {
  let store: SessionStore;

  beforeEach(() => {
    store = new SessionStore();
  });

  it('starts signed out', () => {
    expect(store.isAuthenticated()).toBe(false);
    expect(store.displayName()).toBeNull();
    expect(store.expiresAt()).toBeNull();
    expect(store.can('accounts:view')).toBe(false);
  });

  it('exposes the session through signals', () => {
    store.set(session);
    expect(store.isAuthenticated()).toBe(true);
    expect(store.displayName()).toBe('A Approver');
    expect(store.organisationName()).toBe('Test Org');
    expect(store.role()).toBe('approver');
    expect(store.expiresAt()?.toISOString()).toBe(session.expiresAt);
  });

  it('answers permission questions without caring about roles', () => {
    store.set(session);
    expect(store.can('payments:approve')).toBe(true);
    expect(store.can('audit:read')).toBe(false);
    expect(store.canAny('audit:read', 'accounts:view')).toBe(true);
    expect(store.canAny('audit:read', 'users:manage')).toBe(false);
  });

  it('clears and records load failures', () => {
    store.markLoadFailed();
    expect(store.loadFailed()).toBe(true);
    store.set(session);
    expect(store.loadFailed()).toBe(false);
    store.clear();
    expect(store.isAuthenticated()).toBe(false);
  });
});

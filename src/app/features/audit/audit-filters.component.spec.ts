import { TestBed } from '@angular/core/testing';

import { provideFixtureBackend } from '../../testing/fixture-backend-testing';
import { AuditFiltersComponent } from './audit-filters.component';

// TODO(LDG-1204): AuditPageComponent page spec (server paging, filter re-query, export flag) is
// still owed; the filters component is covered because its debounce bit us in INC-2024-0887.
describe('AuditFiltersComponent', () => {
  it('debounces form edits into a trimmed query and drops empty fields', async () => {
    jest.useFakeTimers();
    try {
      TestBed.configureTestingModule({ providers: provideFixtureBackend() });
      const fixture = TestBed.createComponent(AuditFiltersComponent);
      const emitted: unknown[] = [];
      fixture.componentInstance.queryChange.subscribe(q => emitted.push(q));
      fixture.detectChanges();

      fixture.componentInstance.form.patchValue({ actor: '  t.nakamura ', text: '' });
      jest.advanceTimersByTime(100);
      fixture.componentInstance.form.patchValue({ categories: ['payments'] });
      expect(emitted).toEqual([]);
      jest.advanceTimersByTime(300);
      expect(emitted).toEqual([{ actor: 't.nakamura', categories: ['payments'] }]);

      fixture.componentInstance.form.patchValue({ actor: 't.nakamura' });
      jest.advanceTimersByTime(300);
      expect(emitted).toHaveLength(1);
    } finally {
      jest.useRealTimers();
    }
  });
});

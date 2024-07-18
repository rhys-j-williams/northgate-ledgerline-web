import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipListboxChange, MatChipOption } from '@angular/material/chips';
import { By } from '@angular/platform-browser';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideFixtureBackend } from '../../testing/fixture-backend-testing';

import { LdgFilterChip, LdgFilterChipsComponent } from './filter-chips.component';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, LdgFilterChipsComponent],
  template: `
    <ldg-filter-chips [chips]="chips" [multiple]="multiple" [formControl]="control" ariaLabel="Rails"
                      (selectionChange)="changes.push($event)"></ldg-filter-chips>
  `
})
class HostComponent {
  chips: LdgFilterChip[] = [
    { value: 'wire', label: 'Wire', count: 2 },
    { value: 'ach', label: 'ACH', count: 4, icon: 'cn:check' },
    { value: 'rtp', label: 'RTP', disabled: true, icon: 'bolt' }
  ];
  multiple = true;
  control = new FormControl<string[] | string | null>(['wire']);
  changes: string[][] = [];
}

describe('LdgFilterChipsComponent (cn-filter-chips replacement)', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent, NoopAnimationsModule], providers: provideFixtureBackend() }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  const chipsComponent = () => fixture.debugElement.query(By.directive(LdgFilterChipsComponent)).componentInstance as LdgFilterChipsComponent;
  const options = () => fixture.debugElement.queryAll(By.directive(MatChipOption)).map(d => d.componentInstance as MatChipOption);

  it('renders MDC chip options with the Canopy class names', () => {
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('ldg-filter-chips')?.classList.contains('cn-filter-chips')).toBe(true);
    expect(root.querySelectorAll('mat-chip-option.cn-filter-chips__chip').length).toBe(3);
    expect(root.querySelector('mat-chip-listbox')?.getAttribute('aria-label')).toBe('Rails');
    expect(Array.from(root.querySelectorAll('.cn-filter-chips__count')).map(e => e.textContent?.trim())).toEqual(['2', '4']);
  });

  it('reflects the form control value into the listbox', () => {
    expect(options().map(o => o.selected)).toEqual([true, false, false]);
    expect(options()[2].disabled).toBe(true);
    host.control.setValue(['ach', 'wire']);
    fixture.detectChanges();
    expect(options().map(o => o.selected)).toEqual([true, true, false]);
  });

  it('propagates listbox changes to the control and the output', () => {
    chipsComponent().onListboxChange({ value: ['ach'] } as MatChipListboxChange);
    expect(host.control.value).toEqual(['ach']);
    expect(host.changes).toEqual([['ach']]);
    chipsComponent().onListboxChange({ value: null } as unknown as MatChipListboxChange);
    expect(host.control.value).toEqual([]);
  });

  it('shows a clear button only when something is selected', () => {
    const clear = () => (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.cn-filter-chips__clear');
    expect(clear()).not.toBeNull();
    clear()!.click();
    fixture.detectChanges();
    expect(host.control.value).toEqual([]);
    expect(host.changes.at(-1)).toEqual([]);
    expect(clear()).toBeNull();
    chipsComponent().clear();
    expect(host.changes.length).toBe(1);
  });

  it('emits a scalar in single select mode', () => {
    host.multiple = false;
    host.control.setValue('wire');
    fixture.detectChanges();
    chipsComponent().onListboxChange({ value: 'ach' } as MatChipListboxChange);
    expect(host.control.value).toBe('ach');
    chipsComponent().onListboxChange({ value: undefined } as unknown as MatChipListboxChange);
    expect(host.control.value).toBeNull();
  });

  it('honours disabled state from the form control', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(chipsComponent().disabled).toBe(true);
    chipsComponent().onListboxChange({ value: ['ach'] } as MatChipListboxChange);
    expect(host.control.value).toEqual(['wire']);
    chipsComponent().clear();
    expect(host.changes).toEqual([]);
  });

  it('distinguishes svg icon names from ligatures', () => {
    const c = chipsComponent();
    expect(c.isSvgIcon('cn:check')).toBe(true);
    expect(c.isSvgIcon('bolt')).toBe(false);
    expect(c.isSvgIcon(undefined)).toBe(false);
    expect(c.trackByValue(0, host.chips[1])).toBe('ach');
  });
});

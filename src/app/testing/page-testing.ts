import { Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LdgEnvironment } from '@env/environment.model';
import { provideFixtureBackend, signInFixtureUser } from './fixture-backend-testing';
import { SessionStore } from '../core/auth/session.store';

/**
 * Render a routed page against the fixture BFF with a signed-in approver, and wait for the first
 * load. `prepare` runs after the injector exists and before the component is created, for tests
 * that need to poke the fixture dataset first. `env` overrides APP_CONFIG (feature flags, mostly).
 */
export async function renderPage<T>(
  component: Type<T>,
  inputs: Record<string, unknown> = {},
  prepare: () => void = () => undefined,
  env: Partial<LdgEnvironment> = {}
): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({ providers: provideFixtureBackend(env) });
  signInFixtureUser(TestBed.inject(SessionStore));
  prepare();
  const fixture = TestBed.createComponent(component);
  for (const [key, value] of Object.entries(inputs)) {
    fixture.componentRef.setInput(key, value);
  }
  fixture.detectChanges();
  await settle(fixture);
  return fixture;
}

/** Fixture responses resolve on a macrotask; whenStable() would wait on the countdown intervals forever. */
export async function settle<T>(fixture: ComponentFixture<T>, turns = 4): Promise<void> {
  for (let i = 0; i < turns; i++) {
    await new Promise(resolve => setTimeout(resolve, 0));
    fixture.detectChanges();
  }
}

export function text(fixture: ComponentFixture<unknown>, selector: string): string[] {
  return Array.from((fixture.nativeElement as HTMLElement).querySelectorAll(selector)).map(e => e.textContent?.trim() ?? '');
}

export function click(fixture: ComponentFixture<unknown>, selector: string): void {
  const el = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(selector);
  if (!el) throw new Error(`No element for ${selector}`);
  el.click();
  fixture.detectChanges();
}

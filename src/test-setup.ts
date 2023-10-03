import 'jest-preset-angular/setup-jest';

// jsdom has no ResizeObserver; the CDK virtual scroll and the liquidity chart both look for one.
class ResizeObserverStub {
  observe(): void { /* noop */ }
  unobserve(): void { /* noop */ }
  disconnect(): void { /* noop */ }
}
Object.defineProperty(window, 'ResizeObserver', { writable: true, value: ResizeObserverStub });

// Material's MDC components call getComputedStyle on every render; jsdom implements it but logs
// about unsupported pseudo elements. Quieten that, nothing else.
const originalGetComputedStyle = window.getComputedStyle;
window.getComputedStyle = (elt: Element, pseudo?: string | null) =>
  originalGetComputedStyle(elt, pseudo ?? undefined);

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false
  })
});

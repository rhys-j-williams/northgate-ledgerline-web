import { defineConfig } from 'cypress';

// Runs against `ng serve --configuration e2e` on 4203 (PORTS.md). Jenkins starts the dev server in
// the same stage with wait-on; locally use `npm run e2e:serve` in a second terminal.
export default defineConfig({
  e2e: {
    baseUrl: 'http://127.0.0.1:4203',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1366,
    viewportHeight: 900,
    defaultCommandTimeout: 10000,
    retries: { runMode: 1, openMode: 0 },
    setupNodeEvents(on) {
      on('task', {
        table(rows: unknown[]) {
          console.table(rows);
          return null;
        }
      });
    }
  }
});

import 'cypress-axe';
import './commands';

// The fixture backend logs its synthetic latency at debug level; keep the Cypress console readable.
Cypress.on('window:before:load', win => {
  win.console.debug = () => undefined;
});

import { Result } from 'axe-core';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      signInAsApprover(): Chainable<void>;
    }
  }
}

Cypress.Commands.add('signInAsApprover', () => {
  // The fixture backend signs the first treasury approver in automatically; this just waits for
  // the shell to settle so axe does not scan the skeleton state.
  cy.get('[data-test="shell-nav"]', { timeout: 15000 }).should('be.visible');
  cy.get('ldg-loading-state').should('not.exist');
});

// axe's default summary is one line; the table is what you actually need in the Jenkins log.
export function logViolations(violations: Result[]): void {
  cy.task('table', violations.map(v => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.length,
    help: v.help,
    first: v.nodes[0]?.target.join(' ')
  })), { log: false });
}

import { logViolations } from '../../support/commands';

// Approvals queue + detail. This is the screen the auditors actually watched during the 2024
// attestation. color-contrast is the only rule switched off: the failures are all Canopy brand
// green on white (4.08:1, shell header and cn-badge tone="brand"), owned by CNPY-2011 and fixed in
// Canopy 3.8. Everything we own on this page passes with the rule on; see LDG-1092 for the sweep.
describe('Payment approvals accessibility', () => {
  beforeEach(() => {
    cy.visit('/approvals');
    cy.injectAxe();
    cy.signInAsApprover();
  });

  it('has no axe violations on the queue', () => {
    cy.get('[data-test="approvals-table"] tbody tr').should('have.length.at.least', 1);
    cy.checkA11y(undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } }
    }, logViolations);
  });

  it('has no axe violations on the detail page', () => {
    cy.get('[data-test="approvals-table"] tbody tr').first().click();
    cy.location('pathname').should('match', /\/approvals\/.+/);
    cy.get('[data-test="approval-detail"]').should('be.visible');
    cy.checkA11y(undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } }
    }, logViolations);
  });
});

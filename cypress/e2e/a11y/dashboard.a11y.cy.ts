import { logViolations } from '../../support/commands';

// WCAG 2.1 AA sweep of the liquidity dashboard. Rules disabled below are tracked:
//   - color-contrast on the Canopy "muted" token: CNPY-2011, fixed in Canopy 3.8, not our call.
describe('Liquidity dashboard accessibility', () => {
  beforeEach(() => {
    cy.visit('/dashboard');
    cy.injectAxe();
    cy.signInAsApprover();
  });

  it('has no axe violations with default filters', () => {
    cy.get('[data-test="liquidity-tiles"]').should('be.visible');
    cy.checkA11y(undefined, {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] },
      rules: { 'color-contrast': { enabled: false } }
    }, logViolations);
  });

  it('keeps the filter chips operable and labelled after a selection', () => {
    cy.get('ldg-filter-chips mat-chip-option').first().click();
    cy.get('ldg-filter-chips [role="option"][aria-selected="true"]').should('have.length.at.least', 1);
    cy.get('[data-test="liquidity-tiles"]').should('be.visible');
    cy.checkA11y('ldg-filter-chips', {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa'] }
    }, logViolations);
  });
});

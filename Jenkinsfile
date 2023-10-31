#!/usr/bin/env groovy
// ledgerline-web. Owner @meridian/treasury-digital. Pipeline questions to #platform-engineering.
//
// Jest, not Karma, so no CHROME_BIN dance and no ChromeHeadlessCI launcher; the shared library's
// default testCommand assumes Karma and is overridden below. Cypress runs in a post-build stage
// because the shared pipeline has no e2e hook yet (TOOL-1207, open since 2024-03).
@Library('meridian-pipeline@v3') _

meridianNodePipeline(
    agentLabel:        'nodejs18-rhel9',
    nodeVersion:       '18.19.0',
    appName:           'ledgerline-web',
    helmChart:         'platform-tooling/helm/ledgerline-web',
    // Gate is 58 while the audit view catches up (LDG-1204); target in the QE plan is 60.
    coverageThreshold: 58,
    lintCommand:       'npm run lint',
    testCommand:       'npm test -- --ci --coverage --coverageReporters=json-summary --coverageReporters=lcov',
    buildCommand:      'npm run build:prod',
    coverageSummary:   'coverage/coverage-summary.json',
    // patch-package runs in postinstall; if the Canopy patch stops applying the install must fail
    // loudly rather than produce a bundle with the Angular 14 templates in it (LDG-1187).
    installCommand:    'npm ci --no-audit --no-fund',
    postBuild: {
        stage('Cypress a11y') {
            sh 'npx ng serve --configuration e2e --port 4203 > cypress-serve.log 2>&1 &'
            sh 'npx wait-on --timeout 120000 http://127.0.0.1:4203'
            sh 'npx cypress run --spec "cypress/e2e/a11y/**/*.cy.ts"'
        }
    }
)

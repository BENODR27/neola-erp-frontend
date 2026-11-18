# MMMS implementation status

The authoritative requirement is [MMMS-NEW.MD](../../../../reqs/MMMS-NEW.MD). Live implementation coverage and outstanding acceptance work are maintained in [MMMS-REQUIREMENTS-COVERAGE.md](../../../../docs/MMMS-REQUIREMENTS-COVERAGE.md).

MMMS includes audited movements, verified repairs, recurring maintenance, inspection defects, stock transactions, expense/vendor/calibration workflows, measured reports and selected offline breakdown synchronization. Focused feature components replace the old generic screens. Review coverage for test evidence and deployment acceptance boundaries.

Use /mmms through shared AuthGuard login. Configure MMMS_API_URL in the frontend environment. See [developer setup](../../../../docs/MMMS-GETTING-STARTED.md) and [architecture](../../../../docs/ARCHITECTURE.md).

Run npm test and npm run test:integration in mmms-backend, npm test in storage-service, and npm run validate plus the QR/export tests in frontend. See the root testing and customization guides for repeatable isolated verification and developer extension points.

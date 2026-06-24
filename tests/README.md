# Tests Directory

## Run all tests
```
npm test
```

## Run subset
```
npm run test:parsers       # parser unit tests
npm run test:integration   # E2E pipeline test
```

## Structure
- `tests/fixtures/` — captured vendor responses (snapshots)
- `tests/parsers.test.mjs` — parser tests using fixtures
- `tests/integration.test.mjs` — E2E pipeline test (pull → parse → validate → DB)
- `providers/scraper/parsers/__tests__/parsers.test.mjs` — Phase A unit tests

## Pre-commit hook
node --check server.js + app.js + run all tests

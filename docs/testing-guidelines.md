# Testing Guidelines

All new features must include appropriate tests. Tests must be isolated, independent, and succeed on multiple runs. Each test should set up its own data and not rely on other tests. Setup and teardown hooks are required.

## Unit Tests

Use Jest to test individual functions and React components in isolation.

- **File naming**: `*.test.js` or `*.test.ts`
- **Backend location**: `packages/backend/__tests__/`
- **Frontend location**: `packages/frontend/src/__tests__/`
- Name test files to match what they're testing (e.g., `app.test.js` for testing `app.js`)

## Integration Tests

Use Jest + Supertest to test backend API endpoints with real HTTP requests.

- **File naming**: `*.test.js` or `*.test.ts`
- **Location**: `packages/backend/__tests__/integration/`
- Name integration test files intelligently based on what they test (e.g., `todos-api.test.js` for TODO API endpoints)

## End-to-End (E2E) Tests

Use Playwright (the required framework) to test complete UI workflows through browser automation.

- **File naming**: `*.spec.js` or `*.spec.ts`
- **Location**: `tests/e2e/`
- Name E2E test files based on the user journey they test (e.g., `todo-workflow.spec.js`)
- Use one browser only
- Use the Page Object Model (POM) pattern for maintainability
- Limit to 5–8 critical user journeys — focus on happy paths and key edge cases, not exhaustive coverage

## Port Configuration

Always use environment variables with sensible defaults for port configuration to allow CI/CD workflows to dynamically detect ports.

- **Backend**: `const PORT = process.env.PORT || 3030;`
- **Frontend**: React's default port is 3000, but can be overridden with the `PORT` environment variable

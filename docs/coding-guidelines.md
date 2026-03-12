# Coding Guidelines

## Linting

All code must pass linting before being committed. Use the project's configured linter to catch errors and enforce consistent style.

## DRY Principle

Follow the Don't Repeat Yourself (DRY) principle. Avoid duplicating logic or data — extract shared behavior into reusable functions, components, or modules.

## Naming Conventions

- Use `camelCase` for variables and functions.
- Use `PascalCase` for React components.

## Function Design

- Keep function lengths under 50 lines.
- Follow the Single Responsibility Principle — each function or component should have one clear purpose.

## JavaScript Best Practices

- Prefer `const` over `let`; avoid `var`.
- Use `async/await` over raw Promises or callbacks.
- Always handle errors in async code with `try/catch`.

## React Best Practices

- Prefer functional components and hooks over class components.

## Security

- Validate and sanitize all user input.

## Dependencies

- Don't add dependencies for trivial tasks.

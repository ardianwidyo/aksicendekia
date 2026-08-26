<!--
Sync Impact Report:
- Version change: 0.0.0 (Template Scaffold) → 1.0.0
- Modified Principles: N/A (Initial Ratification)
- Added Principles:
  - I. Technology Stack & Core Foundations (Node.js/TypeScript, Fastify, PostgreSQL with Prisma ORM)
  - II. Clean Architecture & Layer Separation (Controllers, Services, Repositories)
  - III. Test-Driven Development & Quality Assurance (Vitest, TDD Red-Green-Refactor, 80%+ Test Coverage, Strict Type-Checking)
  - IV. Security & Defensive Design (Zod Validation, JWT Auth, Rate Limiting)
- Added Sections:
  - Technical Stack & Infrastructure
  - Development Workflow & Quality Gates
- Removed Sections: None
- Follow-up TODOs: None
-->

# Aksi Cendekia Constitution

## Core Principles

### I. Technology Stack & Core Foundations
The Aksi Cendekia backend MUST be built exclusively using **Node.js** with **TypeScript** configured in strict mode. **Fastify** SHALL be used as the primary HTTP framework for high performance and low latency. Data persistence MUST be managed via **PostgreSQL** using **Prisma ORM** as the type-safe schema and query interface. Direct raw database queries without Prisma context or unsafe dynamic SQL string concatenation are strictly forbidden.

### II. Clean Architecture & Layer Separation
The codebase MUST strictly adhere to Clean Architecture principles, enforcing clear separation of concerns across distinct layers:
- **Controllers**: Responsible strictly for HTTP request extraction, invoking input validation, formatting HTTP responses, and setting status codes. Controllers MUST NOT contain business logic or database access logic.
- **Services**: Encapsulate pure business logic, domain rules, and application workflows. Services MUST be agnostic of HTTP frameworks (Fastify request/reply objects) and MUST NOT perform direct database operations.
- **Repositories**: Encapsulate data access, persistence logic, and database operations using Prisma ORM. Repositories MUST expose domain entities or data transfer objects (DTOs) to Services.

Cross-layer dependency violations (e.g., Controllers accessing Prisma directly or Services referencing HTTP-specific objects) are strictly prohibited.

### III. Test-Driven Development & Quality Assurance (NON-NEGOTIABLE)
Test-Driven Development (TDD) is MANDATORY for all feature implementation, refactoring, and bug fixes.
- The Red-Green-Refactor cycle MUST be strictly enforced: automated tests written using **Vitest** first → user/requirement alignment → test failure verified → code written to pass → refactor.
- Minimum automated test coverage threshold is **80%** across lines, functions, branches, and statements. PRs or builds with test coverage under 80% MUST be automatically blocked.
- TypeScript strict mode MUST be enabled (`"strict": true` in `tsconfig.json`). Explicit or implicit usage of `any` type is strictly forbidden (`@typescript-eslint/no-explicit-any`).

### IV. Security & Defensive Design
Every API endpoint exposed by Aksi Cendekia MUST enforce strict security controls at the entry point:
- **Input Validation**: ALL incoming request payloads (params, query parameters, headers, body) MUST be validated and parsed using **Zod** schemas before execution reaches controllers or services.
- **Authentication & Authorization**: Protected endpoints MUST enforce JSON Web Token (**JWT**) verification. Token signing and verification MUST use secure secrets/keys.
- **Rate Limiting**: Rate limiting MUST be enabled globally and configured per endpoint using Fastify rate-limiting middleware to guard against brute-force attacks and abuse.

## Technical Stack & Infrastructure

- **Runtime & Language**: Node.js (LTS), TypeScript (Strict Mode enabled).
- **HTTP Framework**: Fastify.
- **Database & Persistence**: PostgreSQL with Prisma ORM.
- **Schema Validation**: Zod.
- **Security & Auth**: JWT (JSON Web Tokens) and Fastify Rate Limiting.
- **Testing Suite**: Vitest with v8/c8 coverage runner.

## Development Workflow & Quality Gates

- **TDD Workflow**: Test first → Fail → Code → Pass → Refactor.
- **Code Coverage Gate**: Minimum 80% coverage enforced on all test runs.
- **Type Checking**: Zero TypeScript compiler (`tsc`) errors allowed in build and CI pipeline.
- **Linting & Formatting**: Strict ESLint & Prettier execution preventing `any` types and unhandled promise rejections.

## Governance

1. **Supremacy**: This Constitution supersedes all informal conventions, individual preferences, or ad-hoc architectural decisions.
2. **Compliance**: All Pull Requests and commits MUST comply with these principles. Code reviews MUST verify adherence to TDD, Clean Architecture layer separation, 80%+ coverage, Zod validation, JWT auth, and rate limiting.
3. **Amendments**: Amendments to this document require explicit team review, a documented rationale, and a version increment.
4. **Versioning Policy**:
   - **MAJOR**: Removal or incompatible restructuring of core principles or governance rules.
   - **MINOR**: Addition of new tech stack requirements, expanded quality standards, or architecture principles.
   - **PATCH**: Clarification of wording, typos, or minor formatting adjustments.

**Version**: 1.0.0 | **Ratified**: 2026-08-26 | **Last Amended**: 2026-08-26

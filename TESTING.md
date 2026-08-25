# Testing Strategy & Quality Assurance — Distributed Compute Marketplace

## 1. Quality & Coverage Target

- **Overall Automated Test Coverage**: Target **>90%** (Statements, Lines, Functions, Branches).
- **Zero Failing Tests**: 100% of automated tests must pass before any sprint or pull request is approved.
- **No Mocking of Core Domain Logic**: Business logic, billing math, and scheduling strategies must be tested with real deterministic fixtures.

---

## 2. Test Pyramid Structure

```text
               / \
              /   \
             / E2E \       Playwright User Journeys
            /-------\
           / Contract\     OpenAPI / DTO Schema Validation
          /-----------\
         / Integration \   Postgres + Redis Real Service Tests
        /---------------\
       /      Unit       \ Vitest / Pytest Business Logic
      /-------------------\
```

### 2.1 Unit Tests (`tests/unit/` & `apps/*/test`)
- **NestJS Services**: Auth, scheduler ranking math, billing calculation, provider registry.
- **Provider Agent**: Hardware parser, benchmark score calculator, heartbeat pulse constructor.
- **Shared Types & Validation**: Zod / class-validator validation schemas.

### 2.2 Integration Tests (`tests/integration/`)
- Database transactions, rollback integrity, and concurrency isolation.
- Redis node heartbeat lease timeout and event pub/sub.

### 2.3 Contract & API Tests
- Validates that API responses strictly match the OpenAPI specification schemas.

### 2.4 End-to-End (E2E) Tests (`tests/e2e/`)
- User registers → logs in → browses marketplace → filters compute → submits workload → inspects invoice.

---

## 3. Running Tests via Podman

```bash
# Run unit & integration test suites in podman
podman run --rm -v $(pwd):/workspace:z -w /workspace node:20-alpine sh -c "npm run test"

# Generate test coverage report
podman run --rm -v $(pwd):/workspace:z -w /workspace node:20-alpine sh -c "npm run test:cov"
```

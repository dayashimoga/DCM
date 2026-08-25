# Contributing Guidelines — Distributed Compute Marketplace

We welcome contributions from the community to make distributed compute more open, accessible, and performant.

---

## 1. Development Workflow

1. **Fork and Clone**:
   ```bash
   git clone https://github.com/<your-username>/marketplace.git
   cd marketplace
   ```

2. **Podman Environment**:
   We use **Podman** for containerized local development and validation to keep the host environment clean.

3. **Branching Strategy**:
   - `main`: Production-ready, fully tested code.
   - `feature/<name>`: New feature work.
   - `fix/<name>`: Bug fixes and security patches.

---

## 2. Coding & Quality Standards

- **TypeScript**: Strict type checking (`noImplicitAny`, strict null checks).
- **Style & Linting**: ESLint + Prettier. Run formatting before submitting PRs.
- **Testing**: Every new feature or fix must include unit and integration tests.
- **Coverage**: Project maintains >90% automated test coverage threshold.

---

## 3. Pull Request Requirements

Before opening a PR, ensure all checks pass:
```bash
# Run validation script via Podman
./scripts/podman-validate.sh
```
All PRs must include clear descriptions, acceptance tests, and corresponding updates to `CHANGELOG.md` and `TODO.md`.

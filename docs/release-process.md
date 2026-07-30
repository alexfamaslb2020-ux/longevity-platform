# Release Process

## Overview

Longevity Platform follows a trunk-based development model with short-lived feature branches.

**Branches:**

| Branch | Purpose | Deploy |
|---|---|---|
| `main` | Development, feature work | CI validation only |
| `staging` | Pre-production validation | Auto-deploy to staging |

## Release Workflow

```
feature branch → PR → main → staging → production
```

### 1. Development

- Create a feature branch from `main`
- Make changes, write tests
- Run `npm run lint && npm run typecheck && npm run build && npm test`
- Open PR to `main`

### 2. Pull Request

PR to `main` triggers:
- Lint
- Typecheck
- Build
- Unit tests
- E2E tests

All must pass before merge.

### 3. Staging

Once `main` is stable, merge to `staging`:

```bash
git checkout staging
git merge main
git push origin staging
```

This triggers the staging deployment pipeline (see `deploy-staging.yml`).

### 4. Production (Future)

TBD — will follow similar process with manual approval gate.

## Versioning

Use semantic versioning: `MAJOR.MINOR.PATCH`

- **MAJOR:** Breaking API changes
- **MINOR:** New features, backwards compatible
- **PATCH:** Bug fixes

The version is stored in `apps/api/package.json` and tagged in Git:

```bash
git tag v0.2.0
git push origin v0.2.0
```

## Hotfix Process

For urgent fixes that cannot wait for the normal release cycle:

1. Branch from `staging`: `git checkout staging -b hotfix/issue-description`
2. Fix and test
3. Merge directly to `staging`: `git checkout staging && git merge hotfix/issue-description`
4. After validation, merge back to `main`
5. Delete hotfix branch

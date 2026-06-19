# Contributing

## Releases

Versions are managed by [semantic-release](https://semantic-release.gitbook.io/) on push to `master`.

Use [Conventional Commits](https://www.conventionalcommits.org/) in commit messages:

```
feat: add template local rootDir override
fix: guard output paths against traversal
chore: update dependencies
```

| Commit type | Version bump |
|-------------|--------------|
| `feat` | minor |
| `fix`, `chore`, `docs`, `refactor`, `test`, `perf` | patch |
| `BREAKING CHANGE` / `feat!` | major |

CI runs build + test, then publishes `@kaskenov/smith` to npm and updates `CHANGELOG.md`.

## Git hooks

[Husky](https://typicode.github.io/husky/) enforces hooks locally:

| Hook | Command |
|------|---------|
| `pre-commit` | `pnpm test` |
| `commit-msg` | conventional commit format via commitlint |
| `pre-push` | `pnpm build && pnpm test` |

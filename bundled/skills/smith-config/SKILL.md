---
name: smith-config
description: >-
  Explains smith root and template config via createSmithConfig, variables as
  functions, and hook execution order. Use when the user edits .smith/config.js,
  adds variables or before/after hooks, validates smith config, or mentions
  smith_validate or smith_create_config MCP.
---
# Smith config

Smith projects configure replication through JavaScript config files using `createSmithConfig`.

## File locations

| File | Scope |
|------|-------|
| `.smith/config.js` | Root config — shared across all templates |
| `.smith/templates/<template>/config.js` | Template-local overrides |

## `createSmithConfig`

```js
const { createSmithConfig } = require('@kaskenov/smith/dist/config/createSmithConfig');

module.exports = createSmithConfig((smith) => ({
  rootDir: 'src',
  placeholder: ['{{', '}}'],
  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
    NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
  },
  before: async (ctx, s) => { /* ... */ },
  after: async (ctx, s) => { /* ... */ },
}));
```

The factory receives `{ format }` on `smith` for string transforms (`pascal`, `kebab`, `camel`, `snake`, etc.).

Config fields:

| Field | Type | Description |
|-------|------|-------------|
| `rootDir` | string | Relative output root when `--path` is omitted |
| `placeholder` | `[open, close]` | Delimiter pair; default `['{{', '}}']` |
| `variables` | `Record<string, fn>` | Named placeholders → string functions |
| `before` | async hook | Runs before file replication |
| `after` | async hook | Runs after file replication |

Invalid `placeholder` (not a length-2 tuple) throws at config load time.

## Variables as functions

Each variable is `(ctx, smith) => string`:

- `ctx.name` — replicate name from CLI/MCP (also injected after variable resolution)
- `ctx.path` — resolved output root
- `ctx.template` — template folder name
- `ctx.cwd`, `ctx.root` — working and project roots
- `smith.format.*` — casing helpers
- `smith.path.*` — path helpers (`fromRoot`, `toOutput`, etc.)
- `smith.fs.*` — read/write/ensureDir for hooks

Variable errors throw: `Variable "<key>" failed: <message>`.

Root and template `variables` merge; **template keys override root** for the same name.

## Hook order

During `smith replicate`, hooks run in this fixed order:

1. **Root `before`**
2. **Local template `before`**
3. **Replicate** — walk template tree, substitute placeholders, write files
4. **Local template `after`**
5. **Root `after`**

Local hooks are **not** merged into root — each runs at its stage. Use local `before`/`after` for template-specific setup (ensure dirs, update index files).

On failure, writes from the current run are rolled back.

## MCP: `smith_validate`

Validate root and/or template config before editing or replicating.

- Loads `.smith/config.js` via `loadRootConfig`
- Optionally loads `.smith/templates/<template>/config.js` via `loadTemplateConfig`
- Returns `{ errors: string[] }` — empty array means valid

Use after creating or patching config files to catch syntax and schema issues early.

## MCP: `smith_create_config`

Scaffold or patch the root `.smith/config.js` with a starter block:

- `createSmithConfig` wrapper
- Default `placeholder: ['{{', '}}']`
- `NAME_PASCAL` and `NAME_KEBAB` variable functions

Use when initializing a smith project or restoring a minimal working config. Pair with `smith_init` to also create the `templates/` directory.

## MCP: `smith_init`

Creates:

- `.smith/config.js` (minimal starter)
- `.smith/templates/` directory

Prefer `smith_init` for brand-new projects; use `smith_create_config` when only the root config is missing or needs the default variables block.

## Merge rules (root + template)

| Field | Merge behavior |
|-------|----------------|
| `rootDir` | Template wins if set |
| `placeholder` | Template wins if set |
| `variables` | `{ ...root, ...template }` |
| `before` / `after` | Separate hooks; order shown above |

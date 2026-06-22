---
name: smith
description: >-
  Work with smith template projects (.smith/): replicate templates, scaffold configs,
  validate setup, and manage placeholders/hooks. Use when the user mentions smith,
  smith replicate, .smith/templates, createSmithConfig, template scaffolding, or
  smith MCP tools (smith_replicate, smith_validate, smith_init).
---
# Smith agent guide

Smith generates files from folder templates under `.smith/templates/` with `{{placeholder}}` substitution in paths and contents.

**Prefer smith MCP tools** when the smith MCP server is installed. Fall back to CLI (`smith replicate`, etc.) when MCP is unavailable.

## Project layout

```
project/
  .smith/
    config.js                 # root config (variables, hooks)
    templates/
      component/              # template name
        config.js             # optional per-template overrides (not copied)
        {{name}}.vue
```

- Template **name** = directory name under `.smith/templates/`
- `config.js` inside a template configures replication only — it is **not** copied to output
- Default placeholders: `{{name}}`, plus variables from config (e.g. `{{NAME_PASCAL}}`)

## Replicate

Generate files from a template. Requires `.smith/` and the template directory.

### MCP: `smith_replicate` (preferred)

| Param | Required | Description |
|-------|----------|-------------|
| `name` | yes | Source name for variables (e.g. `Button`, `my-button`) |
| `template` | yes | Template folder under `.smith/templates/` |
| `path` | no | Output root (defaults to project or template `rootDir`) |
| `force` | no | Overwrite existing files |
| `skip` | no | Skip existing files |

Do not set both `force` and `skip`.

### CLI

```bash
smith replicate --name Button --template component
smith replicate --name Button --template component --force
smith replicate --name Button --template component --skip
```

**Conflict policy:** default prompts; use `force` or `skip` (or MCP equivalents) for non-interactive runs.

**Hook order:** root `before` → template `before` → file replication → template `after` → root `after`. Failures roll back writes from the current run.

## Config

Root: `.smith/config.js`. Optional per-template: `.smith/templates/<name>/config.js`.

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

- `variables` merge: template keys override root
- `before`/`after` hooks run at their stage (not merged)
- Validate after edits with `smith_validate`

## MCP tools reference

| Tool | Use when |
|------|----------|
| `smith_project_info` | Discover project root and template names |
| `smith_list_templates` | List templates; optional file tree for one template |
| `smith_read_file` | Read a file under `.smith/` |
| `smith_validate` | Validate root and/or template config loads |
| `smith_replicate` | Generate files from a template |
| `smith_init` | New project: create `.smith/config.js` and `templates/` |
| `smith_create_config` | Add root config when only that file is missing |
| `smith_create_template` | Scaffold a new template folder with optional files |

## Install agent tooling

```bash
smith install              # MCP server (default, recommended)
smith install skills       # optional: copies this skill to agent dirs
smith install list         # check installed MCP and skills
```

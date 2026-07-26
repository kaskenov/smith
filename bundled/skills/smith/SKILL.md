---
name: smith
description: >-
  Work with smith template projects (.smith/) and global templates (~/.smith/):
  replicate templates, scaffold configs, validate setup, manage global templates
  from path/git, and use placeholders/hooks. Use when the user mentions smith,
  smith replicate, smith templates, .smith/templates, createSmithConfig, or
  smith MCP tools (smith_replicate, smith_validate, smith_templates_add).
---
# Smith agent guide

Smith generates files from folder templates with `{{placeholder}}` substitution in paths and contents.

**Prefer smith MCP tools** when the smith MCP server is installed. Fall back to CLI when MCP is unavailable.

## Trust model

- Template `config.js` and hooks are **full Node** (can use fs/network). Only install templates you trust.
- MCP `smith_templates_add` / `smith_templates_update` require `acknowledgeExecutableConfig: true`.
- CLI `templates add|update` require `--acknowledge-executable-config`.
- MCP `smith_templates_remove` requires `confirm: true`; CLI remove requires `--confirm`.
- Absolute output paths and `..` segments are rejected by default (CLI: `--allow-absolute` opt-in).

## Template locations

1. **Project:** `<project>/.smith/templates/<name>/`
2. **Global:** `~/.smith/templates/<name>/`

Resolve order: local first, then global. Local always wins on name clash.
Template names: `[A-Za-z0-9][A-Za-z0-9._-]*` only (no path segments).

## Global home (`~/.smith/`)

```
~/.smith/
  config.js             # shared variables (NAME_PASCAL, NAME_KEBAB, ...)
  templates/<name>/
  sources.json          # recorded smith templates add --from metadata
```

```bash
smith templates add frontend-app --from ./path/to/template --acknowledge-executable-config
smith templates add frontend-app --from git@github.com:org/repo.git --path templates/frontend-app --acknowledge-executable-config
smith templates list
smith templates remove frontend-app --confirm
smith templates update --acknowledge-executable-config
smith templates init-config
```

Git sources: `https://`, `ssh://`, `git@`, `github:` only (no `http://` / `git://`).

## Project layout

```
project/
  .smith/
    config.js
    templates/
      component/
        config.js
        {{name}}.vue
```

## Replicate

Works with local or global templates. Project `.smith/` is optional when the template is global.

### MCP: `smith_replicate`

| Param | Required | Description |
|-------|----------|-------------|
| `name` | yes | Source name for variables |
| `template` | yes | Local or global template name |
| `path` | no | Output root (**relative only** — no absolute, no `..`) |
| `force` / `skip` | no | Conflict policy; **defaults to skip** when neither is set |

### CLI

```bash
smith replicate --name Button --template component
smith replicate --name Button --template component --path /abs/out --allow-absolute
smith list
```

**Config merge:** global → project → template (later wins for variables).  
**Hooks:** global before → project before → template before → replicate → afters reverse.

## Config

- Global: `~/.smith/config.js`
- Project: `.smith/config.js`
- Template: `templates/<name>/config.js` (not copied to output)

Configs execute as trusted Node on validate/replicate.

```js
const { createSmithConfig } = require('@kaskenov/smith/dist/config/createSmithConfig');

module.exports = createSmithConfig((smith) => ({
  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
    NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
  },
}));
```

## MCP tools

| Tool | Use when |
|------|----------|
| `smith_project_info` | Project root (or null) + templates with sources |
| `smith_list_templates` | List local/global templates; optional tree |
| `smith_read_file` | Read file under project `.smith/` |
| `smith_validate` | Validate global/project/template config |
| `smith_replicate` | Generate files (default skip; relative path only) |
| `smith_templates_add` | Install global template (`acknowledgeExecutableConfig: true`) |
| `smith_templates_remove` | Remove global template (`confirm: true`) |
| `smith_templates_update` | Re-fetch from sources.json (`acknowledgeExecutableConfig: true`) |
| `smith_templates_init_config` | Ensure `~/.smith/config.js` starter |
| `smith_init` | Bootstrap project `.smith/` |
| `smith_create_config` | Add project root config |
| `smith_create_template` | Scaffold project template folder |

## Install agent tooling

```bash
smith install
smith install skills
smith install list
```

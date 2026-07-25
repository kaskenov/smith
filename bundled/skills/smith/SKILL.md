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

## Template locations

1. **Project:** `<project>/.smith/templates/<name>/`
2. **Global:** `~/.smith/templates/<name>/`

Resolve order: local first, then global. Local always wins on name clash.

## Global home (`~/.smith/`)

```
~/.smith/
  config.js             # shared variables (NAME_PASCAL, NAME_KEBAB, ...)
  templates/<name>/
  sources.json          # recorded smith templates add --from metadata
```

```bash
smith templates add frontend-app --from ./path/to/template
smith templates add frontend-app --from git@github.com:org/repo.git --path templates/frontend-app
smith templates list
smith templates remove frontend-app
smith templates update
smith templates init-config
```

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
| `path` | no | Output root |
| `force` / `skip` | no | Conflict policy |

### CLI

```bash
smith replicate --name Button --template component
smith list
```

**Config merge:** global → project → template (later wins for variables).  
**Hooks:** global before → project before → template before → replicate → afters reverse.

## Config

- Global: `~/.smith/config.js`
- Project: `.smith/config.js`
- Template: `templates/<name>/config.js` (not copied to output)

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
| `smith_replicate` | Generate files from a template |
| `smith_templates_add` | Install global template from path/git |
| `smith_templates_remove` | Remove global template |
| `smith_templates_update` | Re-fetch from sources.json |
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

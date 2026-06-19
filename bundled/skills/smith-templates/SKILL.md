---
name: smith-templates
description: >-
  Guides smith template layout under .smith/templates, placeholder names like
  {{name}} and {{NAME_PASCAL}}, nested directories, and per-template config.js.
  Use when the user asks to create, edit, or scaffold smith templates, add template
  files, or mentions smith_create_template MCP.
---
# Smith templates

Templates are folders under `.smith/templates/<name>/`. Each folder is one replicable template.

## Directory layout

```
project/
  .smith/
    config.js                 # root config (shared variables, hooks)
    templates/
      component/              # template name: "component"
        config.js             # optional per-template overrides
        {{name}}.vue
        {{name}}.spec.ts
      feature/
        {{NAME_PASCAL}}/
          {{NAME_KEBAB}}/
            {{name}}.txt
```

- Template **name** is the directory name (e.g. `component`, `feature`)
- `config.js` inside a template is **not** copied to output — it only configures that template
- All other files and directories are walked and replicated

## Placeholders

Default delimiters are `{{` and `}}` (configurable via `placeholder` in config).

| Placeholder | Typical source | Example (`--name my-button`) |
|-------------|------------------|------------------------------|
| `{{name}}` | CLI `--name` value | `my-button` |
| `{{NAME_PASCAL}}` | variable function | `MyButton` |
| `{{NAME_KEBAB}}` | variable function | `my-button` |

Placeholders work in **file names and file contents**. Define derived names in config `variables`:

```js
variables: {
  NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
  NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
},
```

`ctx.name` is always set from `--name` / MCP `name` after config variables resolve.

## Nested directories

Directory names may include placeholders. Smith creates the full nested path at output:

```
templates/feature/{{NAME_PASCAL}}/{{NAME_KEBAB}}/{{name}}.txt
```

`smith replicate --name my-button --template feature` → `MyButton/my-button/my-button.txt`

## Per-template `config.js`

Optional file: `.smith/templates/<template>/config.js`

```js
const { createSmithConfig } = require('@kaskenov/smith/dist/config/createSmithConfig');

module.exports = createSmithConfig(() => ({
  rootDir: 'src/components',
  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
  },
  before: async (ctx, smith) => {
    smith.fs.ensureDir(smith.path.toOutput('.'));
  },
  after: async (ctx, smith) => {
    // e.g. update barrel exports
  },
}));
```

Local config **merges** with root config:

- `rootDir`, `placeholder` — local overrides root when set
- `variables` — shallow merge; same key in local wins
- `before` / `after` — local hooks run between root hooks (see `smith-config` skill)

## MCP: `smith_create_template`

Use when the user wants a new template folder scaffolded programmatically.

Parameters:

- `name` (required) — new template directory name under `.smith/templates/`
- `files` (optional) — array of `{ path, content }`; paths may use placeholders

Default stub when `files` is omitted: single file `{{name}}.txt`.

Example:

```json
{
  "name": "component",
  "files": [
    { "path": "{{name}}.vue", "content": "<template></template>\n" },
    { "path": "{{name}}.spec.ts", "content": "// tests for {{name}}\n" }
  ]
}
```

After creating a template, validate config with `smith_validate` and replicate with `smith_replicate` or CLI.

## Related MCP tools

- `smith_list_templates` — list template names; optional tree view
- `smith_read_file` — read a file under `.smith/` (e.g. template source)
- `smith_init` — create initial `.smith/config.js` and empty `templates/` directory

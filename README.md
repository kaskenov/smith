# smith

Replicate from folder-based templates with placeholder substitution in file names and contents.

## Install

```bash
pnpm add -g @kaskenov/smith
```

## Install agent tooling

Install the smith **MCP server** so Cursor, Claude Code, and Qwen Code agents can list templates, replicate, validate, and scaffold `.smith/` projects.

```bash
smith install --local          # MCP (default)
smith install list --local
smith install skills --local   # optional agent skill
```

By default, install targets **Cursor, Claude Code, and Qwen Code** in the **current project** (`--local`).

| Flag | Description |
|------|-------------|
| `--cursor` | Cursor only |
| `--claude` | Claude Code only |
| `--qwen` | Qwen Code only |
| `--local` | Project scope (default) — `.cursor/`, `.claude/`, `.qwen/` |
| `--global` | User scope — `~/.cursor/`, `~/.claude/`, `~/.qwen/` |
| `--force` | Overwrite existing MCP entry or skill directory |
| `--dry-run` | Print planned changes without writing files |

### MCP (recommended)

`smith install` registers the `smith` MCP server (`smith mcp` stdio). Config uses an absolute path to `node` + `dist/cli.js` so GUI apps can spawn it reliably.

| Agent | Local path | Global path |
|-------|------------|-------------|
| Cursor | `.cursor/mcp.json` | `~/.cursor/mcp.json` |
| Claude | `.mcp.json` + `.claude/settings.local.json` | `~/.claude.json` |
| Qwen | `.qwen/settings.json` | `~/.qwen/settings.json` |

Claude project MCP also writes `.claude/settings.local.json` with `enabledMcpjsonServers: ["smith"]`.

Qwen stores MCP under `mcpServers` in `settings.json` (same file as other Qwen Code settings).

### Skills (optional)

`smith install skills` copies one optional skill: **`smith`** — a compact guide for replicate, templates, config, and MCP tools. MCP alone is usually enough; install skills for better agent discovery and onboarding.

| Agent | Local path | Global path |
|-------|------------|-------------|
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Claude | `.claude/skills/` | `~/.claude/skills/` |
| Qwen | `.qwen/skills/` | `~/.qwen/skills/` |

### Uninstall

```bash
smith uninstall mcp --local
smith uninstall skills --local
```

### Verify

**Cursor** — reload the window, then check MCP settings. The `smith` server should be connected.

**Claude Code** — start a new session in the project root, run `/mcp`, and confirm `smith` is listed.

**Qwen Code** — start a new session in the project root, run `qwen mcp list`, and confirm `smith` is connected.

```bash
smith install list --local
```

### Examples

```bash
smith install --local
smith install skills --local
smith install mcp --qwen --global --force
smith install list --cursor
```

## Project setup

Create a `.smith` directory at your project root:

```
project/
  .smith/
    config.js
    templates/
      component/
        {{name}}.vue
        {{name}}.spec.ts
```

## Root config

Use `createSmithConfig` to define shared variables and hooks:

```js
const { createSmithConfig } = require('@kaskenov/smith/dist/config/createSmithConfig');

module.exports = createSmithConfig((smith) => ({
  placeholder: ['{{', '}}'],
  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
    NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
  },
  before: async (ctx, s) => { /* ... */ },
  after: async (ctx, s) => { /* ... */ },
}));
```

## Replicate

```bash
smith replicate --name Button --template component
smith r --name Button --template component --path ./src/components
smith replicate --name Button --template component --force
smith replicate --name Button --template component --skip
```

| Flag | Description |
|------|-------------|
| `--name` | Source value for variable resolution (required) |
| `--template` | Template folder under `.smith/templates/` (required) |
| `--path` | Output root directory (optional) |
| `--force` | Overwrite existing files |
| `--skip` | Skip existing files |

## Template local config

Override root settings per template with `.smith/templates/<template>/config.js`:

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
    const indexFile = smith.path.fromRoot('src/index.ts');
    smith.fs.append(indexFile, `export * from './${smith.format.pascal(ctx.name)}';\n`);
  },
}));
```

Local config merges with the root config. Variables with the same key are overridden by the template. Hook order is: root before → local before → replicate → local after → root after.

## Nested templates

Templates can use nested folders and placeholders in directory names:

```
templates/feature/
  {{NAME_PASCAL}}/
    {{NAME_KEBAB}}/
      {{name}}.txt
```

Running `smith replicate --name my-button --template feature` creates `MyButton/my-button/my-button.txt`.

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions, releases, and git hooks.

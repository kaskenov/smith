---
name: smith-replicate
description: >-
  Runs smith replicate to generate files from .smith/templates. Use when the user
  asks to scaffold, replicate, generate from a smith template, run smith replicate
  CLI, or mentions --name, --template, --path, --preset, --force, or --skip flags.
---
# Smith replicate

Generate project files from a smith template folder under `.smith/templates/`.

## When to use

- User wants to scaffold or generate files from an existing smith template
- User mentions `smith replicate`, `smith r`, or replicating a template by name
- User needs to run replication non-interactively (use MCP or `--force` / `--skip`)
- Agent has smith MCP installed and should replicate without shelling out

## CLI

Required flags:

| Flag | Description |
|------|-------------|
| `--name <name>` | Source value for variable resolution (e.g. `Button`, `my-button`) |
| `--template <template>` | Template folder name under `.smith/templates/` |

Optional flags:

| Flag | Description |
|------|-------------|
| `--path <path>` | Output root directory (defaults to project root or template `rootDir`) |
| `--preset <preset>` | Preset name from template config |
| `--force` | Overwrite existing files at the destination |
| `--skip` | Skip existing files without prompting |

Examples:

```bash
smith replicate --name Button --template component
smith r --name my-button --template feature --path ./src/components
smith replicate --name Button --template component --preset full
smith replicate --name Button --template component --force
smith replicate --name Button --template component --skip
```

## MCP: `smith_replicate`

Prefer the MCP tool when smith MCP is available (non-interactive agents, CI, or when conflict policy must be explicit).

Call `smith_replicate` with:

- `name` (required) — same as `--name`
- `template` (required) — same as `--template`
- `path` (optional) — output root
- `preset` (optional) — preset name from template config
- `force` (optional) — overwrite conflicts
- `skip` (optional) — skip conflicts

Returns `{ ok: true, ... }` with replicate metadata.

Do not use `--force` and `--skip` together on CLI; pick one conflict policy.

## Presets

If template config defines `presets`:

- `--preset` / MCP `preset` selects a named preset
- otherwise `defaultPreset` is used when set
- otherwise all template files are replicated and smith warns on stderr

Each preset applies `include` and/or `exclude` glob patterns against template relative paths.

## Conflict policy

When a destination file already exists:

| Mode | How | Behavior |
|------|-----|----------|
| **prompt** (default) | neither `--force` nor `--skip` | Ask: overwrite, skip, or abort |
| **force** | `--force` or MCP `force: true` | Overwrite existing files |
| **skip** | `--skip` or MCP `skip: true` | Leave existing files unchanged |

On **abort**, replication stops and rolls back files written in the current run.

## Prerequisites

- Project has a `.smith` directory (discovered by walking up from cwd)
- Template exists at `.smith/templates/<template>/`
- Root and template configs load without errors (see `smith-config` skill)

## Hook order during replicate

1. Root `before`
2. Template local `before`
3. File tree replication (preset filter + placeholder substitution)
4. Template local `after`
5. Root `after`

If replication throws, tracked writes are rolled back.

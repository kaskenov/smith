# smith

Replicate from folder-based templates with placeholder substitution in file names and contents.

## Install

```bash
pnpm add -g @kaskenov/smith
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

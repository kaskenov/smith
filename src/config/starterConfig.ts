/** Public require path for generated configs (package.json exports "./config"). */
export const CREATE_SMITH_CONFIG_REQUIRE = '@kaskenov/smith/config';

const SHARED_NAME_VARIABLES = `  variables: {
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
    NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
    NAME_CONSTANT: (ctx, s) => s.format.constant(ctx.name),
    NAME_UPPER: (ctx, s) => s.format.constant(ctx.name),
    NAME_TITLE: (ctx, s) => s.format.title(ctx.name),
  },`;

/** Starter for ~/.smith/config.js and project .smith/config.js — same NAME_* variables. */
export function smithConfigStarterContent(): string {
  return `const { createSmithConfig } = require('${CREATE_SMITH_CONFIG_REQUIRE}');

module.exports = createSmithConfig((smith) => ({
${SHARED_NAME_VARIABLES}
}));
`;
}

export function globalConfigStarterContent(): string {
  return smithConfigStarterContent();
}

export function projectConfigStarterContent(): string {
  return smithConfigStarterContent();
}

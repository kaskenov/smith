const { createSmithConfig } = require('../../../../dist/config/createSmithConfig');

module.exports = createSmithConfig((smith) => ({
  variables: {
    NAME: (ctx) => ctx.name,
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
    NAME_KEBAB: (ctx, s) => s.format.kebab(ctx.name),
  },
}));

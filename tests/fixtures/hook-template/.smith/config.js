const { createSmithConfig } = require('../../../../dist/config/createSmithConfig');

module.exports = createSmithConfig(() => ({
  variables: {
    NAME: (ctx) => ctx.name,
    NAME_PASCAL: (ctx, s) => s.format.pascal(ctx.name),
  },
  before: async () => {
    global.__SMITH_ORDER__.push('root-before');
  },
  after: async () => {
    global.__SMITH_ORDER__.push('root-after');
  },
}));

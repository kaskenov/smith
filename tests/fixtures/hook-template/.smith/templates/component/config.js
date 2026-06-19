const { createSmithConfig } = require('../../../../../dist/config/createSmithConfig');

module.exports = createSmithConfig(() => ({
  before: async () => {
    global.__SMITH_ORDER__.push('local-before');
  },
  after: async (ctx, smith) => {
    global.__SMITH_ORDER__.push('local-after');
    const indexFile = smith.path.fromRoot('src/index.ts');
    smith.fs.append(indexFile, `export * from './${smith.format.pascal(ctx.name)}';\n`);
  },
}));

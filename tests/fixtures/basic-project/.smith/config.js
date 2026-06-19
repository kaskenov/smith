const { createSmithConfig } = require('../../../../dist/config/createSmithConfig');
module.exports = createSmithConfig(() => ({
  variables: {
    NAME: (_ctx) => _ctx.name,
  },
}));

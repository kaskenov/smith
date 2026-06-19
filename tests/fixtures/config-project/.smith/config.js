const { createSmithConfig } = require('../../../../dist/config/createSmithConfig');

module.exports = createSmithConfig((smith) => ({
  variables: {
    NAME_PASCAL: (_ctx, s) => s.format.pascal('fixture'),
  },
}));

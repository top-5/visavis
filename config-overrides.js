const { override, addBabelPlugin } = require('customize-cra');

module.exports = function override(config, env) {
  config.devtool = 'eval-source-map';
  return config;
};

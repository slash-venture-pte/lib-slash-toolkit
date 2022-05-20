let configs = null;
const CONFIGS = ['email', 'sms', 'aws', 'onesignal', 'firebase'];

// Load configs
const requireFileConfig = key => require(`./${key}.config.js`); // eslint-disable-line
// Load required conflig
const loadAllConfig = () => {
  configs = {};
  CONFIGS.forEach(v => {
    configs[v] =
      requireFileConfig(v) && requireFileConfig(v).default ? requireFileConfig(v).default : requireFileConfig(v);
  });
};
// Start load config
exports.load = loadAllConfig;

exports.extend = customConfigs => {
  if (!configs) {
    loadAllConfig();
  }
  configs = Object.assign(configs, customConfigs);
  return configs;
};

exports.get = key => {
  if (!configs) {
    loadAllConfig();
  }
  if (key) {
    return configs[key];
  }
  return configs;
};

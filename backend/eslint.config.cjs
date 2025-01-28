const sharedConfig = require('@relay-protocol/eslint-config')

// allow comments in JSON files
const config = {
  ...sharedConfig,
  rules: {
    ...sharedConfig.rules,
    'json/*': ['error', { allowComments: true }],
  },
}

module.exports = config

const sharedConfig = require('@relay-protocol/eslint-config')
const sortKeysFix = require('eslint-plugin-sort-keys-fix')
module.exports = [
  ...sharedConfig,
  {
    plugins: {
      'sort-keys-fix': sortKeysFix,
    },
    rules: {
      'sort-keys-fix/sort-keys-fix': 'error',
    },
  },
]

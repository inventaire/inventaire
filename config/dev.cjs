// Custom config for the development server
// This config file will be used if: NODE_ENV=dev
// Override locally in ./local-dev.js

/** @typedef { import('../types/types.ts').Config } Config */
/** @typedef { import('type-fest').PartialDeep } PartialDeep */

/** @type {PartialDeep<Config>} */
const config = {
  env: 'dev',
  dataseed: {
    enabled: true,
  },
  piwik: {
    enabled: false,
  },
  i18n: {
    autofix: true,
  },
}

module.exports = config

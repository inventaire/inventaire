// Custom config for the development server
// This config file will be used if: NODE_ENV=dev
// Override locally in ./local-dev.js

module.exports = {
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

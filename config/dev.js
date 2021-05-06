// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

// Custom config for the development server
// This config file will be used if: NODE_ENV=dev
// Override locally in ./local-dev.js

module.exports = {
  env: 'dev',
  dataseed: {
    enabled: true
  },
  db: {
    enableDesignDocSync: true
  },
  piwik: {
    enabled: false
  }
}

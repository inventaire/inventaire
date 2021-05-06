// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

// Common config for the API tests server and the mocha process
// This config file will be used if: NODE_ENV=tests-unit
// Override locally in ./local-tests-unit.js

module.exports = {
  env: 'tests-unit',
  verbose: false,
  leveldbMemoryBackend: true
}

// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = {
  env: 'tests-integration',

  db: {
    suffix: 'tests'
  },

  leveldbMemoryBackend: false,

  outgoingRequests: {
    baseBanTime: 500
  },

  entitiesRelationsTemporaryCache: {
    checkFrequency: 1000,
    ttl: 3 * 1000
  }
}

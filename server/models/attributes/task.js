// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

module.exports = {
  type: [ 'deduplicate' ],

  entitiesType: [ 'work', 'human' ],

  state: [ undefined, 'merged', 'dismissed' ],

  relationScore: []
}

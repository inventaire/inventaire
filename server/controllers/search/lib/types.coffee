CONFIG = require 'config'

entitiesDbName = CONFIG.db.name 'entities'

typesData =
  works: { indexes: [ 'wikidata', entitiesDbName ], type: 'works' }
  humans: { indexes: [ 'wikidata', entitiesDbName ], type: 'humans' }
  series: { indexes: [ 'wikidata', entitiesDbName ], type: 'series' }
  users: { indexes: [ CONFIG.db.name('users') ], type: 'user' }
  groups: { indexes: [ CONFIG.db.name('groups') ], type: 'group' }

possibleTypes =  Object.keys typesData

module.exports = { typesData, possibleTypes }

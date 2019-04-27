CONFIG = require 'config'

entitiesDbName = CONFIG.db.name 'entities'

typesData =
  works: { indexes: [ 'wikidata', entitiesDbName ], types: [ 'works' ] }
  humans: { indexes: [ 'wikidata', entitiesDbName ], types: [ 'humans' ] }
  series: { indexes: [ 'wikidata', entitiesDbName ], types: [ 'series' ] }
  users: { indexes: [ CONFIG.db.name('users') ], types: [ 'user' ] }
  groups: { indexes: [ CONFIG.db.name('groups') ], types: [ 'group' ] }

possibleTypes =  Object.keys typesData

module.exports = { typesData, possibleTypes }

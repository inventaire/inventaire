CONFIG = require 'config'

localAndRemoteEntity = (type)-> { indexes: [ 'wikidata', CONFIG.db.name('entities') ], type }
remoteOnlyEntity = (type)-> { indexes: [ 'wikidata' ], type }
localDatabase = (dbBaseName, type)-> { indexes: [ CONFIG.db.name(dbBaseName) ], type }

typesData =
  works: localAndRemoteEntity 'works'
  humans: localAndRemoteEntity 'humans'
  series: localAndRemoteEntity 'series'
  genres: remoteOnlyEntity 'genres'
  movements: remoteOnlyEntity 'movements'
  publishers: remoteOnlyEntity 'publishers'
  collections: remoteOnlyEntity 'collections'
  users: localDatabase 'users', 'user'
  groups: localDatabase 'groups', 'group'

possibleTypes =  Object.keys typesData

module.exports = { typesData, possibleTypes }

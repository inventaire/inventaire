CONFIG = require 'config'

localAndRemoteEntity = (type)-> { indexes: [ 'wikidata', CONFIG.db.name('entities') ], type }
remoteOnlyEntity = (type)-> { indexes: [ 'wikidata' ], type }

typesData =
  works: localAndRemoteEntity 'works'
  humans: localAndRemoteEntity 'humans'
  series: localAndRemoteEntity 'series'
  genres: remoteOnlyEntity 'genres'
  movements: remoteOnlyEntity 'movements'
  publishers: remoteOnlyEntity 'publishers'
  collections: remoteOnlyEntity 'collections'
  users: { indexes: [ CONFIG.db.name('users') ], type: 'user' }
  groups: { indexes: [ CONFIG.db.name('groups') ], type: 'group' }

possibleTypes =  Object.keys typesData

module.exports = { typesData, possibleTypes }

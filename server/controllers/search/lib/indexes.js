const CONFIG = require('config')

const indexes = {
  wikidata: 'wikidata',
  // Match CouchDB database names
  entities: CONFIG.db.name('entities'),
  users: CONFIG.db.name('users'),
  groups: CONFIG.db.name('groups')
}

const localAndRemoteEntity = type => ({
  indexes: Object.values(indexes),
  type
})

const remoteOnlyEntity = type => ({
  indexes: [ indexes.wikidata ],
  type
})

const localDatabase = (dbBaseName, type) => ({
  indexes: [ indexes[dbBaseName] ],
  type
})

const typesData = {
  works: localAndRemoteEntity('works'),
  humans: localAndRemoteEntity('humans'),
  series: localAndRemoteEntity('series'),
  publishers: localAndRemoteEntity('publishers'),
  collections: localAndRemoteEntity('collections'),
  genres: remoteOnlyEntity('genres'),
  movements: remoteOnlyEntity('movements'),
  users: localDatabase('users', 'user'),
  groups: localDatabase('groups', 'group')
}

const possibleTypes = Object.keys(typesData)

const indexedEntitiesTypes = [
  'works',
  'humans',
  'genres',
  'movements',
  'publishers',
  'series',
  'collections'
]

module.exports = { indexes, typesData, possibleTypes, indexedEntitiesTypes }

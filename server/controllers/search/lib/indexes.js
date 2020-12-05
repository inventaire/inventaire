const CONFIG = require('config')

const indexes = {
  wikidata: 'wikidata',
  // Match CouchDB database names
  entities: CONFIG.db.name('entities'),
  users: CONFIG.db.name('users'),
  groups: CONFIG.db.name('groups')
}

const localAndRemoteEntitiesTypes = [
  'works',
  'humans',
  'genres',
  'movements',
  'publishers',
  'series',
  'collections',
]

const remoteOnlyEntitiesTypes = [
  'genres',
  'movements',
]

const socialTypes = [
  'users',
  'groups',
]

const indexedEntitiesTypes = localAndRemoteEntitiesTypes.concat(remoteOnlyEntitiesTypes)

const indexedTypes = indexedEntitiesTypes.concat(socialTypes)

module.exports = { indexes, indexedTypes, indexedEntitiesTypes, localAndRemoteEntitiesTypes }

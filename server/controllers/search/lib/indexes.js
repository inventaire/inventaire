const CONFIG = require('config')

const indexes = {
  wikidata: 'wikidata',
  // Match CouchDB database names
  entities: CONFIG.db.name('entities'),
  users: CONFIG.db.name('users'),
  groups: CONFIG.db.name('groups')
}

const indexedEntitiesTypes = [
  // inventaire and wikidata entities
  'works',
  'humans',
  'genres',
  'publishers',
  'series',
  'collections',

  // wikidata entities only
  'genres',
  'movements',
]

const socialTypes = [
  'users',
  'groups',
]

const indexedTypes = indexedEntitiesTypes.concat(socialTypes)

module.exports = { indexes, indexedTypes, indexedEntitiesTypes }

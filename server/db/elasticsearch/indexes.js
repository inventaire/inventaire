const CONFIG = require('config')
const _ = require('builders/utils')

// Using CouchDB database names + environment suffix as indexes names
const indexesData = [
  { indexBaseName: 'wikidata', index: 'wikidata', sync: false },
  // Match CouchDB database names
  { indexBaseName: 'entities', sync: true },
  { indexBaseName: 'items', sync: true },
  { indexBaseName: 'groups', sync: true },
  { indexBaseName: 'users', sync: true },
]
.map(data => {
  data.index = data.index || CONFIG.db.name(data.indexBaseName)
  return data
})

const indexes = _.keyBy(indexesData, 'indexBaseName')
const indexesList = _.map(indexesData, 'index')
const indexesNamesByBaseNames = _.mapValues(indexes, 'index')

const syncIndexesList = indexesData
  .filter(indexData => indexData.sync)
  .map(_.property('indexBaseName'))

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

module.exports = { indexes, indexesNamesByBaseNames, indexesList, syncIndexesList, indexedTypes, indexedEntitiesTypes }

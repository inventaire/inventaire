import CONFIG from 'config'
import _ from '#builders/utils'

// Using CouchDB database names + environment suffix as indexes names
const indexesData = [
  { indexBaseName: 'wikidata', index: 'wikidata', sync: false },
  { indexBaseName: 'languages', index: 'languages', sync: false },
  // Match CouchDB database names
  { indexBaseName: 'entities', sync: true },
  { indexBaseName: 'items', sync: true },
  { indexBaseName: 'groups', sync: true },
  { indexBaseName: 'users', sync: true },
  { indexBaseName: 'shelves', sync: true },
  { indexBaseName: 'lists', sync: true },
]
.map(data => {
  data.index = data.index || CONFIG.db.name(data.indexBaseName)
  return data
})

export const indexes = _.keyBy(indexesData, 'indexBaseName')
export const indexesList = _.map(indexesData, 'index')
export const indexesNamesByBaseNames = _.mapValues(indexes, 'index')

export const syncIndexesList = indexesData
  .filter(indexData => indexData.sync)
  .map(_.property('indexBaseName'))

export const indexedEntitiesTypes = [
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

export const socialTypes = [
  'users',
  'groups',
  'shelves',
  'lists',
]

export const indexedTypes = indexedEntitiesTypes.concat(socialTypes)

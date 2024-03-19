import { keyBy, map, mapValues, property } from 'lodash-es'
import config from '#server/config'

// Using CouchDB database names + environment suffix as indexes names
const indexesData = [
  { indexBaseName: 'wikidata', index: 'wikidata', sync: false },
  // Match CouchDB database names
  { indexBaseName: 'entities', index: config.db.name('entities'), sync: true },
  { indexBaseName: 'items', index: config.db.name('items'), sync: true },
  { indexBaseName: 'groups', index: config.db.name('groups'), sync: true },
  { indexBaseName: 'users', index: config.db.name('users'), sync: true },
  { indexBaseName: 'shelves', index: config.db.name('shelves'), sync: true },
  { indexBaseName: 'lists', index: config.db.name('lists'), sync: true },
] as const

export const indexes = keyBy(indexesData, 'indexBaseName')
export const indexesList = map(indexesData, 'index')
export const indexesNamesByBaseNames = mapValues(indexes, 'index')

export type IndexBaseName = typeof indexesData[number]['indexBaseName']

export const syncIndexesList = indexesData
  .filter(indexData => indexData.sync)
  .map(property('indexBaseName'))

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
  'languages',
]

export const socialTypes = [
  'users',
  'groups',
  'shelves',
  'lists',
]

export const indexedTypes = indexedEntitiesTypes.concat(socialTypes)

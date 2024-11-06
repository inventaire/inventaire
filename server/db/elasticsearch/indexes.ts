import { keyBy, map, mapValues, pick, property } from 'lodash-es'
import { typesAliases } from '#lib/wikidata/aliases'
import config from '#server/config'
import type { InvEntityDoc } from '#server/types/entity'
import type { Group } from '#server/types/group'
import type { Item } from '#server/types/item'
import type { Listing } from '#server/types/listing'
import type { Shelf } from '#server/types/shelf'
import type { User } from '#server/types/user'

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

export type IndexedCouchDoc = InvEntityDoc | Item | Group | User | Shelf | Listing

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
] as const

export const socialTypes = [
  'users',
  'groups',
  'shelves',
  'lists',
] as const

export const indexedTypes = [ ...indexedEntitiesTypes, ...socialTypes ]

export const indexedEntitiesTypesAliases = Object.values(pick(typesAliases, indexedEntitiesTypes)).flat()

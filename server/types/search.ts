import type { indexedTypes } from '#db/elasticsearch/indexes'

export type IndexedType = typeof indexedTypes[number]
export type IndexedTypes = IndexedType[]

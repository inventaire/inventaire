import { isImageHash, isPositiveIntegerString, isSimpleDay, isUrl } from '#lib/boolean_validations'
import { EntityUri } from '#lib/regex'
import { boundedString } from '#models/validations/common'
import type { PropertyValueConstraints } from '#types/property'

export const entity: PropertyValueConstraints = {
  datatype: 'entity',
  primitiveType: 'string',
  validate: ({ value }: { value: string }) => EntityUri.test(value),
}

export const uniqueString: PropertyValueConstraints = {
  datatype: 'string',
  primitiveType: 'string',
  // Aligning max length on Wikidata's limit
  validate: ({ value }) => boundedString(value, 1, 1500),
  uniqueValue: true,
}

const restrictedEntityTypes = types => Object.assign({ entityValueTypes: types }, entity)

export const workEntity: PropertyValueConstraints = restrictedEntityTypes([ 'work' ])
export const serieEntity: PropertyValueConstraints = restrictedEntityTypes([ 'serie' ])
export const workOrSerieEntity: PropertyValueConstraints = restrictedEntityTypes([ 'work', 'serie' ])
export const humanEntity: PropertyValueConstraints = restrictedEntityTypes([ 'human' ])
export const publisherEntity: PropertyValueConstraints = restrictedEntityTypes([ 'publisher' ])
export const collectionEntity: PropertyValueConstraints = restrictedEntityTypes([ 'collection' ])
export const movementEntity: PropertyValueConstraints = restrictedEntityTypes([ 'movement' ])
export const genreEntity: PropertyValueConstraints = restrictedEntityTypes([ 'genre' ])
export const languageEntity: PropertyValueConstraints = restrictedEntityTypes([ 'language' ])
export const uniqueEntity: PropertyValueConstraints = Object.assign({}, entity, { uniqueValue: true })

export const concurrentString: PropertyValueConstraints = Object.assign({}, uniqueString, { concurrency: true })
export const concurrentExternalId: PropertyValueConstraints = Object.assign({}, concurrentString, { datatype: 'external-id' })

export const url: PropertyValueConstraints = {
  datatype: 'url',
  primitiveType: 'string',
  validate: ({ value }: { value: string }) => isUrl(value),
}

export const uniqueSimpleDay: PropertyValueConstraints = {
  datatype: 'date',
  primitiveType: 'string',
  validate: ({ value }: { value: string }) => isSimpleDay(value),
  uniqueValue: true,
}

export const positiveInteger: PropertyValueConstraints = {
  datatype: 'positive-integer',
  primitiveType: 'number',
  validate: ({ value }: { value: number }) => Number.isInteger(value) && value > 0,
  uniqueValue: true,
}

export const positiveIntegerString: PropertyValueConstraints = {
  datatype: 'positive-integer-string',
  primitiveType: 'string',
  validate: ({ value }: { value: string }) => isPositiveIntegerString(value),
  uniqueValue: true,
}

export const imageHash: PropertyValueConstraints = {
  datatype: 'image',
  primitiveType: 'string',
  validate: ({ value }: { value: string }) => isImageHash(value),
  uniqueValue: true,
}

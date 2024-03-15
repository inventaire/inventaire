import { isImageHash, isPositiveIntegerString, isSimpleDay, isUrl } from '#lib/boolean_validations'
import { EntityUri } from '#lib/regex'
import commonValidations from '#models/validations/common'
import type { PropertyValueConstraints } from '#types/property'

const { BoundedString } = commonValidations

export const entity: PropertyValueConstraints = {
  datatype: 'entity',
  primitiveType: 'string',
  validate: EntityUri.test.bind(EntityUri),
}

export const uniqueString: PropertyValueConstraints = {
  datatype: 'string',
  primitiveType: 'string',
  // Aligning max length on Wikidata's limit
  validate: BoundedString(1, 1500),
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
  validate: isUrl,
}

export const uniqueSimpleDay: PropertyValueConstraints = {
  datatype: 'date',
  primitiveType: 'string',
  // See SimpleDay specifications in [inventaire-client]/test/106-regex.js
  validate: isSimpleDay,
  uniqueValue: true,
}

export const positiveInteger: PropertyValueConstraints = {
  datatype: 'positive-integer',
  primitiveType: 'number',
  validate: (value: number) => Number.isInteger(value) && value > 0,
  uniqueValue: true,
}

export const positiveIntegerString: PropertyValueConstraints = {
  datatype: 'positive-integer-string',
  primitiveType: 'string',
  validate: isPositiveIntegerString,
  uniqueValue: true,
}

export const imageHash: PropertyValueConstraints = {
  datatype: 'image',
  primitiveType: 'string',
  validate: isImageHash,
  uniqueValue: true,
}

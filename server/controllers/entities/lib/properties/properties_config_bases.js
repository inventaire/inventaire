import { isImageHash, isPositiveIntegerString, isSimpleDay, isUrl } from '#lib/boolean_validations'
import { EntityUri } from '#lib/regex'
import commonValidations from '#models/validations/common'

const { BoundedString } = commonValidations

export const entity = {
  datatype: 'entity',
  primitiveType: 'string',
  validate: EntityUri.test.bind(EntityUri),
}

export const uniqueString = {
  datatype: 'string',
  primitiveType: 'string',
  // Aligning max length on Wikidata's limit
  validate: BoundedString(1, 1500),
  uniqueValue: true,
}

const restrictedEntityTypes = types => Object.assign({ entityValueTypes: types }, entity)

export const workEntity = restrictedEntityTypes([ 'work' ])
export const serieEntity = restrictedEntityTypes([ 'serie' ])
export const workOrSerieEntity = restrictedEntityTypes([ 'work', 'serie' ])
export const humanEntity = restrictedEntityTypes([ 'human' ])
export const collectionEntity = restrictedEntityTypes([ 'collection' ])
export const uniqueEntity = Object.assign({}, entity, { uniqueValue: true })

export const concurrentString = Object.assign({}, uniqueString, { concurrency: true })
export const concurrentExternalId = Object.assign({}, concurrentString, { datatype: 'external-id' })

export const url = {
  datatype: 'url',
  primitiveType: 'string',
  validate: isUrl,
}

export const uniqueSimpleDay = {
  datatype: 'date',
  primitiveType: 'string',
  // See SimpleDay specifications in [inventaire-client]/test/106-regex.js
  validate: isSimpleDay,
  uniqueValue: true,
}

export const positiveInteger = {
  datatype: 'positive-integer',
  primitiveType: 'number',
  validate: value => Number.isInteger(value) && value > 0,
  uniqueValue: true,
}

export const positiveIntegerString = {
  datatype: 'positive-integer-string',
  primitiveType: 'string',
  validate: isPositiveIntegerString,
  uniqueValue: true,
}

export const imageHash = {
  datatype: 'image',
  primitiveType: 'string',
  validate: isImageHash,
  uniqueValue: true,
}

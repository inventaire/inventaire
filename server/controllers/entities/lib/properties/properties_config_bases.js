import _ from '#builders/utils'
import { EntityUri } from '#lib/regex'
import commonValidations from '#models/validations/common'

const { BoundedString } = commonValidations

export const entity = {
  datatype: 'entity',
  type: 'string',
  validate: EntityUri.test.bind(EntityUri),
}

export const uniqueString = {
  datatype: 'string',
  // Aligning max length on Wikidata's limit
  validate: BoundedString(1, 1500),
  uniqueValue: true,
}

const restrictedEntityType = type => Object.assign({ restrictedType: type }, entity)

export const workEntity = restrictedEntityType('work')
export const serieEntity = restrictedEntityType('serie')
export const humanEntity = restrictedEntityType('human')
export const collectionEntity = restrictedEntityType('collection')
export const uniqueEntity = Object.assign({}, entity, { uniqueValue: true })

export const concurrentString = Object.assign({}, uniqueString, { concurrency: true })
// For the moment, ordinals can be only positive integers, but stringified
// to stay consistent with Wikidata and let the door open to custom ordinals
// later (ex: roman numbers, letters, etc.)

export const url = {
  datatype: 'string',
  validate: _.isUrl,
}

export const uniqueSimpleDay = {
  datatype: 'simple-day',
  type: 'string',
  // See SimpleDay specifications in [inventaire-client]/test/106-regex.js
  validate: _.isSimpleDay,
  uniqueValue: true,
}

export const positiveInteger = {
  datatype: 'positive-integer',
  type: 'number',
  validate: value => Number.isInteger(value) && value > 0,
  uniqueValue: true,
}

export const ordinal = {
  datatype: 'string',
  validate: _.isPositiveIntegerString,
  uniqueValue: true,
}

export const imageHash = {
  datatype: 'image-hash',
  type: 'string',
  validate: _.isImageHash,
  uniqueValue: true,
}

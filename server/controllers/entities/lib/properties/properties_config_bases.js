const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { EntityUri } = __.require('lib', 'regex')
const { BoundedString } = __.require('models', 'validations/common')

const entity = {
  datatype: 'entity',
  type: 'string',
  validate: EntityUri.test.bind(EntityUri)
}

const uniqueString = {
  datatype: 'string',
  // Arbitrary max length
  validate: BoundedString(1, 5000),
  uniqueValue: true
}

const restrictedEntityType = type => Object.assign({ restrictedType: type }, entity)

module.exports = {
  entity,
  workEntity: restrictedEntityType('work'),
  serieEntity: restrictedEntityType('serie'),
  humanEntity: restrictedEntityType('human'),
  collectionEntity: restrictedEntityType('collection'),
  uniqueEntity: Object.assign({}, entity, { uniqueValue: true }),

  uniqueString,
  concurrentString: Object.assign({}, uniqueString, { concurrency: true }),
  // For the moment, ordinals can be only positive integers, but stringified
  // to stay consistent with Wikidata and let the door open to custom ordinals
  // later (ex: roman numbers, letters, etc.)

  url: {
    datatype: 'string',
    validate: _.isUrl
  },

  uniqueSimpleDay: {
    datatype: 'simple-day',
    type: 'string',
    // See SimpleDay specifications in [inventaire-client]/test/106-regex.js
    validate: _.isSimpleDay,
    uniqueValue: true
  },

  positiveInteger: {
    datatype: 'positive-integer',
    type: 'number',
    validate: value => Number.isInteger(value) && value > 0,
    uniqueValue: true
  },

  ordinal: {
    datatype: 'string',
    validate: _.isPositiveIntegerString,
    uniqueValue: true
  },

  imageHash: {
    datatype: 'image-hash',
    type: 'string',
    validate: _.isImageHash,
    uniqueValue: true
  }
}

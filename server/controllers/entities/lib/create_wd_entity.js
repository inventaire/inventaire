const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
const error_ = require('lib/error/error')
const wdEdit = require('lib/wikidata/edit')
const wdOauth = require('./wikidata_oauth')
const validateEntity = require('./validate_entity')
const getEntityType = require('./get_entity_type')
const properties = require('./properties/properties_values_constraints')
const { prefixifyWd, unprefixify } = require('./prefix')
const allowlistedEntityTypes = [ 'work', 'serie', 'human', 'publisher', 'collection' ]

module.exports = async params => {
  const { labels, claims, user, isAlreadyValidated } = params
  wdOauth.validate(user)
  const credentials = wdOauth.getOauthCredentials(user)

  const entity = { labels, claims }

  _.log(entity, 'wd entity creation')

  return validate(entity, isAlreadyValidated)
  .then(() => {
    validateWikidataCompliance(entity)
    return format(entity)
  })
  .then(entity => wdEdit.entity.create(entity, { credentials }))
  .then(res => {
    const { entity: createdEntity } = res
    if (createdEntity == null) {
      throw error_.new('invalid wikidata-edit response', 500, { res })
    }

    createdEntity.uri = prefixifyWd(createdEntity.id)
    return createdEntity
  })
}

const validate = async (entity, isAlreadyValidated) => {
  if (!isAlreadyValidated) return validateEntity(entity)
}

const validateWikidataCompliance = entity => {
  const { claims } = entity
  if (claims == null) throw error_.new('invalid entity', 400, entity)

  const entityType = getEntityType(claims['wdt:P31'])
  if (!allowlistedEntityTypes.includes(entityType)) {
    throw error_.new('invalid entity type', 400, { entityType, entity })
  }

  for (const property in claims) {
    const values = claims[property]
    if (properties[property].datatype === 'entity') {
      for (const value of values) {
        if (value.split(':')[0] === 'inv') {
          throw error_.new('claim value is an inv uri', 400, { property, value })
        }
      }
    }
  }

  return entity
}

const format = entity => {
  const { claims } = entity
  entity.claims = Object.keys(claims)
    .reduce(unprefixifyClaims(claims), {})
  return entity
}

const unprefixifyClaims = claims => (formattedClaims, property) => {
  const unprefixifiedProp = unprefixify(property)
  const propertyValues = claims[property]

  if (properties[property].datatype === 'entity') {
    formattedClaims[unprefixifiedProp] = propertyValues.map(unprefixify)
  } else {
    // datatype 'string' should not be unprefixified, ex: 'Jules Vernes'
    formattedClaims[unprefixifiedProp] = propertyValues
  }
  return formattedClaims
}

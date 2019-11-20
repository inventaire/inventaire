
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const wdEdit = require('wikidata-edit')
const wdOauth = require('./wikidata_oauth')
const { Promise } = __.require('lib', 'promises')
const validateEntity = require('./validate_entity')
const getEntityType = require('./get_entity_type')
const properties = require('./properties/properties_values_constraints')
const { prefixifyWd, unprefixify } = require('./prefix')
const whitelistedEntityTypes = [ 'work', 'serie', 'human', 'publisher' ]

module.exports = params => Promise.try(() => createWdEntity(params))

const createWdEntity = params => {
  const { labels, claims, user, isAlreadyValidated } = params
  wdOauth.validate(user)
  const oauth = wdOauth.getFullCredentials(user)

  let entity = { labels, claims }

  _.log(entity, 'wd entity creation')

  return validate(entity, isAlreadyValidated)
  .then(() => {
    validateWikidataCompliance(entity)
    return format(entity)
  })
  .then(wdEdit({ oauth }, 'entity/create'))
  .then(res => {
    ({ entity } = res)
    if (entity == null) {
      throw error_.new('invalid wikidata-edit response', 500, { res })
    }

    entity.uri = prefixifyWd(entity.id)
    return entity
  })
}

const validate = (entity, isAlreadyValidated) => {
  if (isAlreadyValidated) {
    return Promise.resolve()
  } else {
    return validateEntity(entity)
  }
}

const validateWikidataCompliance = entity => {
  const { claims } = entity
  if (claims == null) throw error_.new('invalid entity', 400, entity)

  const entityType = getEntityType(claims['wdt:P31'])
  if (!whitelistedEntityTypes.includes(entityType)) {
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

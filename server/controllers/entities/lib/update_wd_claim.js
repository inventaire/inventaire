const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const getWdEntity = __.require('data', 'wikidata/get_entity')
const wdk = require('wikidata-sdk')
const wdEdit = __.require('lib', 'wikidata/edit')
const wdOauth = require('./wikidata_oauth')
const properties = require('./properties/properties_values_constraints')
const entitiesRelationsTemporaryCache = require('./entities_relations_temporary_cache')
const { cachedRelationProperties } = require('./temporarily_cache_relations')
const { unprefixify, prefixifyWd } = require('./prefix')

module.exports = async (user, id, property, oldValue, newValue) => {
  wdOauth.validate(user)

  if ((properties[property].datatype === 'entity')) {
    if (_.isInvEntityUri(newValue)) {
      throw error_.new("wikidata entities can't link to inventaire entities", 400)
    }

    oldValue = unprefixify(oldValue)
    newValue = unprefixify(newValue)
  }

  const [ propertyPrefix, propertyId ] = property.split(':')

  if (propertyPrefix !== 'wdt') {
    throw error_.newInvalid('property', propertyPrefix)
  }

  const credentials = wdOauth.getOauthCredentials(user)

  let res

  if (newValue) {
    if (oldValue) {
      res = await wdEdit.claim.update({ id, property: propertyId, oldValue, newValue }, { credentials })
    } else {
      res = await wdEdit.claim.create({ id, property: propertyId, value: newValue }, { credentials })
    }
  } else {
    const guid = await getClaimGuid(id, propertyId, oldValue)
    res = await wdEdit.claim.remove({ guid }, { credentials })
  }

  if (cachedRelationProperties.includes(property)) {
    const uri = prefixifyWd(id)
    if (newValue != null) await entitiesRelationsTemporaryCache.set(uri, property, newValue)
    if (oldValue != null) await entitiesRelationsTemporaryCache.del(uri, property, oldValue)
  }

  return res
}

const getClaimGuid = async (id, propertyId, oldVal) => {
  const entity = await getWdEntity([ id ])
  const propClaims = entity.claims[propertyId]
  const simplifyPropClaims = wdk.simplify.propertyClaims(propClaims)
  const oldValIndex = simplifyPropClaims.indexOf(oldVal)
  const targetClaim = propClaims[oldValIndex]
  return targetClaim.id
}

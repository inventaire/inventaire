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

    if (oldValue) oldValue = unprefixify(oldValue)
    if (newValue) newValue = unprefixify(newValue)
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
    if (newValue != null) {
      entitiesRelationsTemporaryCache.set(uri, property, prefixifyWd(newValue))
      .catch(_.Error('entitiesRelationsTemporaryCache.set err'))
    }
    if (oldValue != null) {
      entitiesRelationsTemporaryCache.del(uri, property, prefixifyWd(oldValue))
      .catch(_.Error('entitiesRelationsTemporaryCache.del err'))
    }
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

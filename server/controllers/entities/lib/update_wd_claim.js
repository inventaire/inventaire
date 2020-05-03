const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const getWdEntity = __.require('data', 'wikidata/get_entity')
const wdk = require('wikidata-sdk')
const wdEdit = __.require('lib', 'wikidata/edit')
const wdOauth = require('./wikidata_oauth')
const properties = require('./properties/properties_values_constraints')

module.exports = async (user, id, property, oldValue, newValue) => {
  wdOauth.validate(user)

  if ((properties[property].datatype === 'entity') && _.isInvEntityUri(newValue)) {
    throw error_.new("wikidata entities can't link to inventaire entities", 400)
  }

  oldValue = dropPrefix(oldValue)
  newValue = dropPrefix(newValue)

  const [ propertyPrefix, propertyId ] = property.split(':')

  if (propertyPrefix !== 'wdt') {
    throw error_.newInvalid('property', propertyPrefix)
  }

  const credentials = wdOauth.getOauthCredentials(user)

  if (newValue) {
    if (oldValue) {
      return wdEdit.claim.update({ id, property: propertyId, oldValue, newValue }, { credentials })
    } else {
      return wdEdit.claim.create({ id, property: propertyId, value: newValue }, { credentials })
    }
  } else {
    const guid = await getClaimGuid(id, propertyId, oldValue)
    return wdEdit.claim.remove({ guid }, { credentials })
  }
}

const getClaimGuid = async (id, propertyId, oldVal) => {
  const entity = await getWdEntity([ id ])
  const propClaims = entity.claims[propertyId]
  const simplifyPropClaims = wdk.simplify.propertyClaims(propClaims)
  const oldValIndex = simplifyPropClaims.indexOf(oldVal)
  const targetClaim = propClaims[oldValIndex]
  return targetClaim.id
}

const dropPrefix = value => {
  if (_.isEntityUri(value)) {
    return value.replace('wd:', '')
  } else {
    return value
  }
}

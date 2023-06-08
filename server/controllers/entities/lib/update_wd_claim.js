import { simplifyPropertyClaims, simplifyPropertyQualifiers } from 'wikibase-sdk'
import _ from '#builders/utils'
import { getWdEntity } from '#data/wikidata/get_entity'
import { error_ } from '#lib/error/error'
import { LogError } from '#lib/utils/logs'
import { qualifierProperties } from '#lib/wikidata/data_model_adapter'
import wdEdit from '#lib/wikidata/edit'
import { validateWdEntityUpdate } from '#lib/wikidata/validate_wd_update'
import entitiesRelationsTemporaryCache from './entities_relations_temporary_cache.js'
import { unprefixify, prefixifyWd } from './prefix.js'
import properties from './properties/properties_values_constraints.js'
import { cachedRelationProperties } from './temporarily_cache_relations.js'
import wdOauth from './wikidata_oauth.js'

// /!\ There are no automatic tests for this function as it modifies Wikidata

export default async (user, id, property, oldValue, newValue) => {
  wdOauth.validate(user)

  await validateWdEntityUpdate({ id, property, oldValue, newValue })

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

  if (qualifierProperties[propertyId]) {
    res = await updateRelocatedClaim({ id, propertyId, newValue, oldValue, credentials })
  } else {
    res = await updateClaim({ id, propertyId, newValue, oldValue, credentials })
  }

  if (cachedRelationProperties.includes(property)) {
    const uri = prefixifyWd(id)
    if (newValue != null) {
      entitiesRelationsTemporaryCache.set(uri, property, prefixifyWd(newValue))
      .catch(LogError('entitiesRelationsTemporaryCache.set err'))
    }
    if (oldValue != null) {
      entitiesRelationsTemporaryCache.del(uri, property, prefixifyWd(oldValue))
      .catch(LogError('entitiesRelationsTemporaryCache.del err'))
    }
  }

  return res
}

const updateClaim = async ({ id, propertyId, newValue, oldValue, credentials }) => {
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

const updateRelocatedClaim = async params => {
  const { id, propertyId, newValue, oldValue, credentials } = params
  const { claimProperty, noClaimErrorMessage, tooManyClaimsErrorMessage } = qualifierProperties[propertyId]
  const propertyClaims = await getPropertyClaims(id, claimProperty)
  if (!propertyClaims) throw error_.new(noClaimErrorMessage, 400, params)
  if (propertyClaims.length !== 1) throw error_.new(tooManyClaimsErrorMessage, 400, params)
  const claim = propertyClaims[0]
  const guid = claim.id
  if (newValue) {
    if (oldValue) {
      return wdEdit.qualifier.update({ guid, property: propertyId, oldValue, newValue }, { credentials })
    } else {
      return wdEdit.qualifier.set({ guid, property: propertyId, value: newValue }, { credentials })
    }
  } else {
    const hash = getQualifierHash(claim, propertyId, oldValue)
    return wdEdit.qualifier.remove({ guid, hash }, { credentials })
  }
}

const getPropertyClaims = async (id, propertyId) => {
  const entity = await getWdEntity(id)
  return entity.claims[propertyId]
}

const getClaimGuid = async (id, propertyId, oldVal) => {
  const propClaims = await getPropertyClaims(id, propertyId)
  const simplifyPropClaims = simplifyPropertyClaims(propClaims)
  const oldValIndex = simplifyPropClaims.indexOf(oldVal)
  const targetClaim = propClaims[oldValIndex]
  return targetClaim.id
}

const getQualifierHash = (claim, property, value) => {
  const qualifiers = simplifyPropertyQualifiers(claim.qualifiers[property], { keepHashes: true })
  const matchingQualifiers = qualifiers.filter(qualifier => qualifier.value === value)
  if (matchingQualifiers.length !== 1) {
    throw error_.new('unique matching qualifier not found', 400, { claim, property, value })
  }
  return matchingQualifiers[0].hash
}

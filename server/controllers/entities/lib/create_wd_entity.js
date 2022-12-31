import _ from 'builders/utils'
import error_ from 'lib/error/error'
import wdEdit from 'lib/wikidata/edit'
import wdOauth from './wikidata_oauth'
import validateEntity from './validate_entity'
import getEntityType from './get_entity_type'
import properties from './properties/properties_values_constraints'
import { prefixifyWd, unprefixify } from './prefix'
import { relocateQualifierProperties } from 'lib/wikidata/data_model_adapter'
const allowlistedEntityTypes = [ 'work', 'serie', 'human', 'publisher', 'collection' ]

export default async params => {
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
  entity.claims = Object.keys(claims).reduce(unprefixifyClaims(claims), {})
  // Relocate qualifier properties after unprefixifying,
  // as the unprefixifyClaims function doesn't handle qualifiers
  relocateQualifierProperties(entity)
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

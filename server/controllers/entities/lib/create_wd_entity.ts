import { getWikidataOAuthCredentials, validateWikidataOAuth } from '#controllers/entities/lib/wikidata_oauth'
import { newError } from '#lib/error/error'
import { log } from '#lib/utils/logs'
import { relocateQualifierProperties } from '#lib/wikidata/data_model_adapter'
import wdEdit from '#lib/wikidata/edit'
import getEntityType from './get_entity_type.js'
import { prefixifyWd, unprefixify } from './prefix.js'
import { getPropertyDatatype } from './properties/properties_values_constraints.js'
import validateEntity from './validate_entity.js'

const allowlistedEntityTypes = [ 'work', 'serie', 'human', 'publisher', 'collection' ]

export default async function (params) {
  const { labels, claims, user, isAlreadyValidated } = params
  validateWikidataOAuth(user)
  const credentials = getWikidataOAuthCredentials(user)

  const entity = { labels, claims }

  log(entity, 'wd entity creation')

  return validate(entity, isAlreadyValidated)
  .then(() => {
    validateWikidataCompliance(entity)
    return format(entity)
  })
  .then(entity => wdEdit.entity.create(entity, { credentials }))
  .then(res => {
    const { entity: createdEntity } = res
    if (createdEntity == null) {
      throw newError('invalid wikidata-edit response', 500, { res })
    }

    createdEntity.uri = prefixifyWd(createdEntity.id)
    return createdEntity
  })
}

async function validate (entity, isAlreadyValidated) {
  if (!isAlreadyValidated) return validateEntity(entity)
}

function validateWikidataCompliance (entity) {
  const { claims } = entity
  if (claims == null) throw newError('invalid entity', 400, entity)

  const entityType = getEntityType(claims['wdt:P31'])
  if (!allowlistedEntityTypes.includes(entityType)) {
    throw newError('invalid entity type', 400, { entityType, entity })
  }

  for (const property in claims) {
    const values = claims[property]
    if (getPropertyDatatype(property) === 'entity') {
      for (const value of values) {
        if (value.split(':')[0] === 'inv') {
          throw newError('claim value is an inv uri', 400, { property, value })
        }
      }
    }
  }

  return entity
}

function format (entity) {
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

  if (getPropertyDatatype(property) === 'entity') {
    formattedClaims[unprefixifiedProp] = propertyValues.map(unprefixify)
  } else {
    // datatype 'string' should not be unprefixified, ex: 'Jules Vernes'
    formattedClaims[unprefixifiedProp] = propertyValues
  }
  return formattedClaims
}

import { chain } from 'lodash-es'
import { getInvEntityType } from '#controllers/entities/lib/get_entity_type'
import { getInvEntityCanonicalUri } from '#controllers/entities/lib/get_inv_entity_canonical_uri'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { getBestLangValue } from '#lib/get_best_lang_value'
import { assertArray, assertString } from '#lib/utils/assert_types'
import { warn } from '#lib/utils/logs'
import type { InvEntityDoc, PropertyUri, SerializedEntity } from '#types/entity'

export function getEntityUriAndType (entity: InvEntityDoc | SerializedEntity) {
  // Case when a serialized entity is passed
  if ('uri' in entity) {
    const { uri, type } = entity
    return { uri, type }
  }

  // Case when a raw entity doc is passed,
  // which can only be an inv entity doc
  const uri = getInvEntityCanonicalUri(entity)
  let type
  if ('claims' in entity) type = getInvEntityType(entity.claims['wdt:P31'])
  return { uri, type }
}

export function getNames (preferedLang, entities) {
  if (!isNonEmptyArray(entities)) return

  return entities
  .map(getName(preferedLang))
  .join(', ')
}

export function aggregateClaims (entities: SerializedEntity[], property: PropertyUri) {
  assertArray(entities)
  assertString(property)

  return chain(entities)
  .filter(entity => {
    const hasClaims = (entity.claims != null)
    if (hasClaims) return true
    // Trying to identify how entities with no claims arrive here
    warn(entity, 'entity with no claim at aggregateClaims')
    return false
  })
  .map(entity => entity.claims[property])
  .flatten()
  .compact()
  .uniq()
  .value()
}

const getName = lang => entity => {
  const { originalLang, labels } = entity
  return getBestLangValue(lang, originalLang, labels).value
}

// Gathering entity formatting steps common to all the consumers
// Keep in sync with get_wikidata_enriched_entities formatting
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import getOriginalLang from '#lib/wikidata/get_original_lang'
import type { SerializedInvEntity, SerializedEntity } from '#server/types/entity'
import { getUrlFromEntityImageHash, setTermsFromClaims } from './entities.js'
import type { SetOptional } from 'type-fest'

export function formatEntityCommon (entity: SetOptional<SerializedInvEntity, 'image'>) {
  entity.originalLang = getOriginalLang(entity.claims)

  setEntityImageFromImageHashClaims(entity)

  if (entity.type === 'edition' || entity.type === 'collection') {
    setTermsFromClaims(entity as SerializedInvEntity)
  }

  return entity as SerializedInvEntity
}

export function setEntityImageFromImageHashClaims (entity: SetOptional<SerializedEntity, 'image'>) {
  // Matching Wikidata entities format for images
  // Here we are missing license, credits, and author attributes
  const imageHash = getFirstClaimValue(entity.claims, 'invp:P2')
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  entity.image = { url: invImageUrl }
}

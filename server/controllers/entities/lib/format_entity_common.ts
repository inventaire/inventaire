// Gathering entity formatting steps common to all the consumers
// Keep in sync with get_wikidata_enriched_entities formatting
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import getOriginalLang from '#lib/wikidata/get_original_lang'
import type { SerializedInvEntity } from '#server/types/entity'
import { getUrlFromEntityImageHash, setTermsFromClaims } from './entities.js'

export function formatEntityCommon (entity) {
  entity.originalLang = getOriginalLang(entity.claims)

  // Matching Wikidata entities format for images
  // Here we are missing license, credits, and author attributes
  const imageHash = getFirstClaimValue(entity.claims, 'invp:P2')
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  entity.image = { url: invImageUrl }

  if (entity.type === 'edition' || entity.type === 'collection') {
    setTermsFromClaims(entity as SerializedInvEntity)
  }

  return entity as SerializedInvEntity
}

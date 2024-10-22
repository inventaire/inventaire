// Gathering entity formatting steps common to all the consumers
// Keep in sync with get_wikidata_enriched_entities formatting
import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { arrayIncludes } from '#lib/utils/base'
import getOriginalLang from '#lib/wikidata/get_original_lang'
import type { SerializedInvEntity, SerializedEntity, LocalImageInfo, SerializedRemovedPlaceholder } from '#server/types/entity'
import { getUrlFromEntityImageHash, setTermsFromClaims, termsFromClaimsTypes } from './entities.js'
import type { SetOptional } from 'type-fest'

export function formatInvEntityCommon (entity: SetOptional<SerializedInvEntity | SerializedRemovedPlaceholder, 'image' | 'invId'>) {
  entity.originalLang = getOriginalLang(entity.claims)

  setEntityImageFromImageHashClaims(entity)

  if (arrayIncludes(termsFromClaimsTypes, entity.type)) {
    // @ts-expect-error
    setTermsFromClaims(entity)
  }

  entity.invId = entity._id
  return entity as (SerializedInvEntity | SerializedRemovedPlaceholder)
}

export function setEntityImageFromImageHashClaims (entity: SetOptional<SerializedEntity, 'image' | 'invId'>) {
  // Matching Wikidata entities format for images
  // Here we are missing license, credits, and author attributes
  const imageHash = getFirstClaimValue(entity.claims, 'invp:P2')
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  entity.image = { url: invImageUrl } as LocalImageInfo
}

// Gathering entity formatting steps common to all the consumers
// Keep in sync with get_wikidata_enriched_entities formatting
import getOriginalLang from '#lib/wikidata/get_original_lang'
import { getFirstClaimValue } from '#models/entity'
import type { LocalImageInfo, SerializedEntity, SerializedInvEntity, SerializedRemovedPlaceholder } from '#server/types/entity'
import { getUrlFromEntityImageHash, setTermsFromClaims } from './entities.js'
import type { SetOptional } from 'type-fest'

export function formatEntityCommon (entity: SetOptional<SerializedInvEntity | SerializedRemovedPlaceholder, 'image'>) {
  entity.originalLang = getOriginalLang(entity.claims)

  setEntityImageFromImageHashClaims(entity)

  if (entity.type === 'edition' || entity.type === 'collection') {
    // @ts-expect-error
    setTermsFromClaims(entity)
  }

  return entity as (SerializedInvEntity | SerializedRemovedPlaceholder)
}

export function setEntityImageFromImageHashClaims (entity: SetOptional<SerializedEntity, 'image'>) {
  // Matching Wikidata entities format for images
  // Here we are missing license, credits, and author attributes
  const imageHash = getFirstClaimValue(entity.claims, 'invp:P2')
  const invImageUrl = getUrlFromEntityImageHash(imageHash)
  entity.image = { url: invImageUrl } as LocalImageInfo
}

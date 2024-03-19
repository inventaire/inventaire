// Gathering entity formatting steps common to all the consumers
// Keep in sync with get_wikidata_enriched_entities formatting
import getOriginalLang from '#lib/wikidata/get_original_lang'
import { setTermsFromClaims } from './entities.js'
import getEntityImagesFromClaims from './get_entity_images_from_claims.js'

export default entity => {
  entity.originalLang = getOriginalLang(entity.claims)

  // Matching Wikidata entities format for images
  // Here we are missing license, credits, and author attributes
  entity.image = { url: getEntityImagesFromClaims(entity)[0] }

  if (entity.type === 'edition' || entity.type === 'collection') {
    setTermsFromClaims(entity)
  }

  return entity
}

const wdk = require('wikidata-sdk')
const { simplify } = wdk
const { getEntityId } = require('./helpers')
const getEntityImagesFromClaims = require('../get_entity_images_from_claims')
const { firstClaim } = require('../entities')

module.exports = entity => {
  entity.id = getEntityId(entity)

  let needSimplification = false

  if (wdk.isItemId(entity.id)) {
    // Only Wikidata entities imported from a dump need to be simplified
    // Wikidata entities with a URI come from the Inventaire API, and are thus already simplified
    needSimplification = entity.uri == null
    entity.uri = 'wd:' + entity.id
  } else {
    entity.uri = 'inv:' + entity.id
    // Deleting inv entities CouchDB documents ids
    delete entity._id
  }

  // Take images from claims if no images object was set by add_entities_images,
  // that is, for every entity types but works and series
  if (!entity.images) {
    entity.images = {
      claims: getEntityImagesFromClaims(entity.claims, needSimplification)
    }
  }

  if (needSimplification) {
    entity.labels = simplify.labels(entity.labels)
    entity.descriptions = simplify.descriptions(entity.descriptions)
    entity.aliases = simplify.aliases(entity.aliases)
  }

  if (Object.keys(entity.labels).length === 0) setTermsFromClaims(entity)

  // Saving space by not indexing claims
  delete entity.claims
  // Deleting if it wasn't already omitted to be consistent
  delete entity.type

  return entity
}

const setTermsFromClaims = entity => {
  const title = firstClaim(entity, 'wdt:P1476')
  const subtitle = firstClaim(entity, 'wdt:P1680')
  if (title) {
    entity.labels = { fromclaims: title }
  }
  if (subtitle) {
    entity.descriptions = { fromclaims: subtitle }
  }
}

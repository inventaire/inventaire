const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const wdk = require('wikidata-sdk')
const { simplify } = wdk
const { getEntityId } = require('./entity_helpers')
const getEntityImagesFromClaims = __.require('controllers', 'entities/lib/get_entity_images_from_claims')
const { firstClaim } = __.require('controllers', 'entities/lib/entities')

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
      claims: getEntityImagesFromClaims(entity, needSimplification)
    }
    if (entity.image != null) {
      entity.images.claims.push(entity.image.url)
    }
  }

  // If passed an already formatted entity
  delete entity.image

  // Inventaire entities are already simplified
  if (needSimplification) {
    const simplifiedLabels = simplify.labels(entity.labels)
    const simplifiedDescriptions = simplify.descriptions(entity.descriptions)
    const simplifiedAliases = simplify.aliases(entity.aliases)

    entity.flattenedLabels = flattenTerms(simplifiedLabels)
    entity.flattenedDescriptions = flattenTerms(simplifiedDescriptions)
    entity.flattenedAliases = flattenTerms(simplifiedAliases)

    entity.labels = removeUnusedLangs(simplifiedLabels)
    entity.descriptions = removeUnusedLangs(simplifiedDescriptions)
    entity.aliases = removeUnusedLangs(simplifiedDescriptions)
  }

  if (Object.keys(entity.labels).length === 0) setTermsFromClaims(entity)

  // Saving space by not indexing claims
  delete entity.claims
  // Deleting if it wasn't already omitted to be consistent
  delete entity.type

  delete entity.sitelinks

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

const flattenTerms = terms => {
  return _.uniq(Object.values(terms)).join(' ')
}

const activeI18nLangs = 'ar bn ca cs da de el en eo es fr hu id it ja nb nl pa pl pt ro ru sk sv tr uk'.split(' ')

// Reject terms langs not used by inventaire-i18n, as entity object indexation shall be less than 1000 keys long
// See: https://discuss.elastic.co/t/limit-of-total-fields-1000-in-index-has-been-exceeded-particular-jsons/222627
const removeUnusedLangs = terms => _.pick(terms, activeI18nLangs)

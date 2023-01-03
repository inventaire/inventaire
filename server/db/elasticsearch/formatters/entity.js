import wdk from 'wikidata-sdk'
import _ from '#builders/utils'
import { setTermsFromClaims } from '#controllers/entities/lib/entities'
import getEntitiesList from '#controllers/entities/lib/get_entities_list'
import getEntityImagesFromClaims from '#controllers/entities/lib/get_entity_images_from_claims'
import getEntityType from '#controllers/entities/lib/get_entity_type'
import { getEntityPopularity } from '#controllers/entities/lib/popularity'
import specialEntityImagesGetter from '#controllers/entities/lib/special_entity_images_getter'
import { indexedEntitiesTypes } from '#db/elasticsearch/indexes'
import { warn } from '#lib/utils/logs'
import { getSingularTypes } from '#lib/wikidata/aliases'
import formatClaims from '#lib/wikidata/format_claims'
import { activeI18nLangs } from '../helpers.js'
import { getEntityId } from './entity_helpers.js'

const { simplify } = wdk
const indexedEntitiesTypesSet = new Set(getSingularTypes(indexedEntitiesTypes))

export default async (entity, options = {}) => {
  entity._id = getEntityId(entity)

  // Entities from Wikidata dump still have a type='item' set
  if (entity.type === 'item') delete entity.type

  let { claims, type } = entity

  if (claims != null && isRawWikidataClaims(claims)) {
    claims = formatClaims(claims)
  }

  delete entity.id

  entity.type = dropPlural(getType({ claims, type }))

  // Do not index entities for which no type was found, as they wouldn't be accepted as values
  // for the corresponding type. To include an entity that was illegitimately rejected,
  // fix either server/lib/wikidata/aliases.js or server/controllers/entities/lib/get_entity_type.js
  // See https://github.com/inventaire/inventaire/pull/294
  if (!indexedEntitiesTypesSet.has(entity.type)) return

  let needsSimplification = false
  const isWikidataEntity = wdk.isItemId(entity._id)

  if (isWikidataEntity) {
    // Only Wikidata entities imported from a dump need to be simplified
    // Wikidata entities with a URI come from the Inventaire API, and are thus already simplified
    needsSimplification = entity.uri == null
    entity.uri = 'wd:' + entity._id
  } else {
    entity.uri = 'inv:' + entity._id
  }

  // Take images from claims if no images object was set by addEntitiesImages,
  // that is, for every entity types but works and series
  if (!entity.images) {
    if (specialEntityImagesGetter[entity.type]) {
      try {
        entity.images = await specialEntityImagesGetter[entity.type](entity)
      } catch (err) {
        // Known case: when Wikidata Query Service times out
        warn(err, `failed to get image for ${entity.uri}: fallback to no image`)
        entity.images = {}
      }
    } else {
      entity.images = {
        claims: getEntityImagesFromClaims(entity, needsSimplification),
      }
    }
  }

  // If passed an already formatted entity
  delete entity.image

  if (needsSimplification) {
    entity.labels = simplify.labels(entity.labels)
    entity.descriptions = simplify.descriptions(entity.descriptions)
    entity.aliases = simplify.aliases(entity.aliases)
  }

  const { labels, descriptions, aliases } = entity

  entity.labels = removeUnusedLangs(labels)
  if (isWikidataEntity) {
    entity.descriptions = removeUnusedLangs(descriptions)
    entity.aliases = removeUnusedLangs(aliases)
  }

  const mainFieldsWords = new Set(getMainFieldsWords(entity))

  if (isWikidataEntity) {
    // Flattened terms are a single string to index all the words from non-active languages
    // that weren't included in the fields above, as those non-active languages didn't get their
    // own fields to avoid having more than 1000 keys in an entity, which is forbidded by elasticsearch
    entity.flattenedLabels = flattenTerms(labels, mainFieldsWords)
    entity.flattenedDescriptions = flattenTerms(descriptions, mainFieldsWords)
    entity.flattenedAliases = flattenTerms(aliases, mainFieldsWords)
  }

  entity.labels = removeUnusedLangs(entity.labels)
  if (isWikidataEntity) {
    entity.descriptions = removeUnusedLangs(entity.descriptions)
    entity.aliases = removeUnusedLangs(entity.aliases)
  }

  if (Object.keys(entity.labels).length === 0) setTermsFromClaims(entity)

  // Duplicating labels and aliases to have a different analyzer applied
  entity.fullLabels = entity.labels
  entity.fullAliases = entity.aliases

  entity.relationsTerms = await getRelationsTerms(entity)

  entity.claim = getFlattenedClaims(claims)

  // Those don't need to be indexed
  delete entity.claims
  delete entity.sitelinks

  entity.popularity = await getEntityPopularity({
    uri: entity.uri,
    // Only use already cached values in quick mode, instead of the default dryAndCache,
    // as that would mean spamming Wikidata when reindexing all entities,
    // and would result in that process being extremely slow, and possibibly crash
    // as we aren't even waiting for the dryAndCache response to continue.
    // But, do not set dry=true when reindexing the rest of the time, as that would
    // in most cases mean never populating the popularity
    dry: options.quick,
  })

  return entity
}

const getType = ({ claims, type }) => {
  if (type && type !== 'entity') return type
  const wdtP31 = claims['wdt:P31']
  return getEntityType(wdtP31)
}

const dropPlural = type => {
  if (type) {
    return type.replace(/s$/, '')
  }
}

const flattenTerms = (terms, mainFieldsWords) => {
  terms = Object.values(terms)
  // Required for aliases
  if (_.isArray(terms[0])) terms = terms.flat()

  return _.chain(terms)
    .flatMap(term => term.split(' '))
    .filter(word => !mainFieldsWords.has(word.toLowerCase()))
    .uniq()
    .join(' ')
    .value()
}

// Reject terms langs not used by inventaire-i18n, as entity object indexation shall be less than 1000 keys long
// See: https://discuss.elastic.co/t/limit-of-total-fields-1000-in-index-has-been-exceeded-particular-jsons/222627
const removeUnusedLangs = terms => _.pick(terms, activeI18nLangs)

const getMainFieldsWords = ({ labels, descriptions = {}, aliases = {} }) => {
  const labelsTerms = Object.values(labels)
  const descriptionsTerms = Object.values(descriptions)
  const aliasesTerms = Object.values(aliases).flat()
  const allTerms = labelsTerms.concat(descriptionsTerms, aliasesTerms)
  return _.chain(allTerms)
    .flatMap(term => term.toLowerCase().split(' '))
    .uniq()
    .value()
}

const getRelationsTerms = async ({ type, claims }) => {
  const indexedRelations = indexedRelationsPerType[type]
  if (!indexedRelations) return ''
  const relationsUris = Object.values(_.pick(claims, indexedRelations)).flat()
  const relationsEntities = await getEntitiesList(relationsUris)
  return relationsEntities.map(getEntityTerms).flat().join(' ')
}

const worksAndSeriesProperties = [
  'wdt:P50', // author
  'wdt:P58', // scenarist
  'wdt:P110', // illustrator
  'wdt:P179', // serie
  'wdt:P6338', // colorist
]

const indexedRelationsPerType = {
  collection: [
    'wdt:P123', // publisher
  ],
  serie: worksAndSeriesProperties,
  work: worksAndSeriesProperties,
}

// Not including descriptions
const getEntityTerms = entity => {
  const { labels, aliases } = entity
  // Known case: deleted Wikidata entity
  if (!labels) {
    warn(entity, 'can not getEntityTerms: entity has no labels')
    return []
  }
  return getMainFieldsWords({ labels, aliases })
}

const getFlattenedClaims = claims => {
  const flattenedClaims = []
  for (const property in claims) {
    const propertyClaims = claims[property]
    for (const value of propertyClaims) {
      flattenedClaims.push(`${property}=${value}`)
    }
  }
  return flattenedClaims
}

const isRawWikidataClaims = claims => {
  const properties = Object.keys(claims)
  return wdk.isPropertyId(properties[0])
}

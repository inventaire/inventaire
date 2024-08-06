import { chain, isArray, pick } from 'lodash-es'
import { isPropertyId, simplifyAliases, simplifyDescriptions, simplifyLabels } from 'wikibase-sdk'
import { setTermsFromClaims } from '#controllers/entities/lib/entities'
import { imageProperties } from '#controllers/entities/lib/get_commons_filenames_from_claims'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getEntityImagesFromClaims } from '#controllers/entities/lib/get_entity_images_from_claims'
import { getEntityType } from '#controllers/entities/lib/get_entity_type'
import { simplifyInvClaims } from '#controllers/entities/lib/inv_claims_utils'
import { languagesCodesProperties } from '#controllers/entities/lib/languages'
import { getEntityPopularity } from '#controllers/entities/lib/popularity'
import { authorRelationsProperties } from '#controllers/entities/lib/properties/properties'
import specialEntityImagesGetter from '#controllers/entities/lib/special_entity_images_getter'
import { indexedEntitiesTypes } from '#db/elasticsearch/indexes'
import { isWdEntityId } from '#lib/boolean_validations'
import { objectEntries } from '#lib/utils/base'
import { warn } from '#lib/utils/logs'
import { getSingularTypes } from '#lib/wikidata/aliases'
import { formatClaims } from '#lib/wikidata/format_claims'
import type { Claims, EntityUri, PropertyUri, SerializedEntity, WdRawClaims } from '#types/entity'
import { activeI18nLangs } from '../helpers.js'
import { getEntityId } from './entity_helpers.js'

const indexedEntitiesTypesSet = new Set(getSingularTypes(indexedEntitiesTypes))

interface EntityFormatterOptions {
  quick?: boolean
}

export default async function (entity, options: EntityFormatterOptions = {}) {
  entity._id = getEntityId(entity)

  // Entities from Wikidata dump still have a type='item' set
  if (entity.type === 'item') delete entity.type

  let { claims, type } = entity

  if (claims != null) {
    if (isRawWikidataClaims(claims)) {
      claims = formatClaims(claims)
    } else {
      claims = simplifyInvClaims(claims)
    }
  }

  if (type === 'languages') claims = pick(claims, languagesCodesProperties)

  delete entity.id

  entity.type = dropPlural(getType({ claims, type }))

  // Do not index entities for which no type was found, as they wouldn't be accepted as values
  // for the corresponding type. To include an entity that was illegitimately rejected,
  // fix either server/lib/wikidata/aliases.js or server/controllers/entities/lib/get_entity_type.js
  // See https://github.com/inventaire/inventaire/pull/294
  if (!indexedEntitiesTypesSet.has(entity.type)) return

  let needsTermsSimplification = false
  const isWikidataEntity = isWdEntityId(entity._id)

  if (isWikidataEntity) {
    // Only Wikidata entities imported from a dump need to be simplified
    // Wikidata entities with a URI come from the Inventaire API, and are thus already simplified
    needsTermsSimplification = entity.uri == null
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
        claims: getEntityImagesFromClaims(entity),
      }
    }
  }

  // If passed an already formatted entity
  delete entity.image

  if (needsTermsSimplification) {
    entity.labels = simplifyLabels(entity.labels)
    entity.descriptions = simplifyDescriptions(entity.descriptions)
    entity.aliases = simplifyAliases(entity.aliases)
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
    // Do not trigger cache population in quick mode, as that would mean adding
    // all the entities to the popularity job queue
    populateCacheOnCacheMiss: !options.quick,
  })

  return entity
}

function getType ({ claims, type }) {
  if (type && type !== 'entity') return type
  const wdtP31 = claims['wdt:P31']
  return getEntityType(wdtP31)
}

function dropPlural (type) {
  if (type) {
    return type.replace(/s$/, '')
  }
}

function flattenTerms (terms, mainFieldsWords) {
  terms = Object.values(terms)
  // Required for aliases
  if (isArray(terms[0])) terms = terms.flat()

  return chain(terms)
    .flatMap(term => term.split(' '))
    .filter(word => !mainFieldsWords.has(word.toLowerCase()))
    .uniq()
    .join(' ')
    .value()
}

// Reject terms langs not used by inventaire-i18n, as entity object indexation shall be less than 1000 keys long
// See: https://discuss.elastic.co/t/limit-of-total-fields-1000-in-index-has-been-exceeded-particular-jsons/222627
const removeUnusedLangs = terms => pick(terms, activeI18nLangs)

function getMainFieldsWords ({ labels, descriptions = {}, aliases = {} }) {
  const labelsTerms = Object.values(labels)
  const descriptionsTerms = Object.values(descriptions)
  const aliasesTerms = Object.values(aliases).flat()
  const allTerms = labelsTerms.concat(descriptionsTerms, aliasesTerms)
  return chain(allTerms)
    .flatMap(term => term.toString().toLowerCase().split(' '))
    .uniq()
    .value()
}

async function getRelationsTerms ({ type, claims }) {
  const indexedRelations = indexedRelationsPerType[type] as (PropertyUri[] | undefined)
  if (!indexedRelations) return ''
  const relationsUris = Object.values(pick(claims, indexedRelations)).flat() as EntityUri[]
  const relationsEntities = await getEntitiesList(relationsUris)
  return relationsEntities.map(getEntityTerms).flat().join(' ')
}

const worksAndSeriesProperties = [
  ...authorRelationsProperties,
  'wdt:P179', // serie
] as const

const indexedRelationsPerType = {
  collection: [
    'wdt:P123', // publisher
  ] as const,
  serie: worksAndSeriesProperties,
  work: worksAndSeriesProperties,
}

// Not including descriptions
function getEntityTerms (entity) {
  const { labels, aliases } = entity
  // Known case: deleted Wikidata entity
  if (!labels) {
    warn(entity, 'can not getEntityTerms: entity has no labels')
    return []
  }
  return getMainFieldsWords({ labels, aliases })
}

function getFlattenedClaims (claims: SerializedEntity['claims']) {
  const flattenedClaims = []
  for (const [ property, propertyClaims ] of objectEntries(claims)) {
    // @ts-expect-error TS2345
    if (!ignoredPropertiesInFlattenedClaims.has(property)) {
      for (const value of propertyClaims) {
        flattenedClaims.push(`${property}=${value}`)
      }
    }
  }
  return flattenedClaims
}

// Properties that are highly unlikely to ever be usefully queried by exact value
const ignoredPropertiesInFlattenedClaims = new Set(imageProperties)

function isRawWikidataClaims (claims: Claims | WdRawClaims) {
  const properties = Object.keys(claims)
  return isPropertyId(properties[0])
}

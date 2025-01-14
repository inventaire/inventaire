import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { isNonEmptyString } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { getBestLangValue } from '#lib/get_best_lang_value'
import { assertArray, assertString } from '#lib/utils/assert_types'
import itemValidations from '#models/validations/item'
import type { SerializedEntity } from '#types/entity'
import type { ItemSnapshot } from '#types/item'
import { getNames, aggregateClaims } from './helpers.js'
import type { WikimediaLanguageCode } from 'wikibase-sdk'

const { snapshotValidations } = itemValidations

export default {
  edition: (edition: SerializedEntity, works: SerializedEntity[], authors: SerializedEntity[], series: SerializedEntity[]) => {
    const lang = edition.originalLang || 'en'
    const { claims } = edition
    let title = getFirstClaimValue(claims, 'wdt:P1476')
    // Wikidata editions might not have a wdt:P1476 value
    title = title || getBestLangValue(lang, null, edition.labels).value
    return buildOperation({
      entity: edition,
      works,
      title,
      subtitle: getFirstClaimValue(claims, 'wdt:P1680'),
      lang,
      image: edition.image?.url,
      authors,
      series,
    })
  },

  work: (work: SerializedEntity, authors: SerializedEntity[], series: SerializedEntity[]) => {
    const { originalLang: lang } = work
    const { claims } = work
    const works = [ work ]
    return buildOperation({
      entity: work,
      works,
      title: getBestLangValue(lang, null, work.labels).value,
      lang,
      image: claims['wdt:P18']?.[0],
      authors,
      series,
    })
  },
}

interface BuildOperationParams {
  entity: SerializedEntity
  works: SerializedEntity[]
  title: string
  subtitle?: string
  lang: WikimediaLanguageCode
  image?: SerializedEntity['image']['url']
  authors: SerializedEntity[]
  series: SerializedEntity[]
}

function buildOperation (params: BuildOperationParams) {
  const { entity, works, title, subtitle, lang, image, authors, series } = params
  assertArray(works)
  if (!isNonEmptyString(title)) {
    throw newError('no title found', 400, { entity })
  }

  const snapshot = {
    'entity:title': title,
    'entity:lang': lang,
  }

  const authorsNames = getNames(lang, authors)
  const seriesNames = getNames(lang, series)

  if (authorsNames) snapshot['entity:authors'] = authorsNames
  if (seriesNames) {
    snapshot['entity:series'] = seriesNames
    setOrdinal(snapshot, works)
  }

  // Filtering out Wikimedia File names, keeping only images hashes or URLs
  if (snapshotValidations['entity:image'](image)) {
    snapshot['entity:image'] = image
  }

  if (isNonEmptyString(subtitle)) {
    snapshot['entity:subtitle'] = subtitle
  }

  const { uri } = entity
  assertString(uri)

  return { key: uri, value: snapshot }
}

function setOrdinal (snapshot: ItemSnapshot, works: SerializedEntity[]) {
  if (works.length === 1) {
    const work = works[0]
    const { claims } = work
    const ordinal = getFirstClaimValue(claims, 'wdt:P1545')
    if (ordinal != null) snapshot['entity:ordinal'] = ordinal
  } else {
    const series = aggregateClaims(works, 'wdt:P179')
    // Aggregate ordinals only if works are from the same unique serie
    if (series.length === 1) {
      const ordinals = aggregateClaims(works, 'wdt:P1545')
      if (ordinals.length > 0) snapshot['entity:ordinal'] = ordinals.join(',')
    }
  }
}

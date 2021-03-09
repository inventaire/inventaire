const _ = require('builders/utils')
const { getNames, aggregateClaims } = require('./helpers')
const error_ = require('lib/error/error')
const assert_ = require('lib/utils/assert_types')
const { snapshotValidations } = require('models/validations/item')
const getBestLangValue = require('lib/get_best_lang_value')

module.exports = {
  edition: (edition, works, authors, series) => {
    const lang = edition.originalLang || 'en'
    const { claims } = edition
    let title = claims['wdt:P1476'] && claims['wdt:P1476'][0]
    // Wikidata editions might not have a wdt:P1476 value
    title = title || getBestLangValue(lang, null, edition.labels).value
    return buildOperation({
      type: 'edition',
      entity: edition,
      works,
      title,
      subtitle: claims['wdt:P1680'] && claims['wdt:P1680'][0],
      lang,
      image: edition.image && edition.image.url,
      authors,
      series
    })
  },

  work: (work, authors, series) => {
    const { originalLang: lang } = work
    const { claims } = work
    const works = [ work ]
    return buildOperation({
      type: 'work',
      entity: work,
      works,
      title: getBestLangValue(lang, null, work.labels).value,
      lang,
      image: claims['wdt:P18'] && claims['wdt:P18'][0],
      authors,
      series
    })
  }
}

const buildOperation = params => {
  const { entity, works, title, subtitle, lang, image, authors, series } = params
  assert_.array(works)
  if (!_.isNonEmptyString(title)) {
    throw error_.new('no title found', 400, entity)
  }

  const snapshot = {
    'entity:title': title,
    'entity:lang': lang
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

  if (_.isNonEmptyString(subtitle)) {
    snapshot['entity:subtitle'] = subtitle
  }

  const { uri } = entity
  assert_.string(uri)

  return { key: uri, value: snapshot }
}

const setOrdinal = (snapshot, works) => {
  if (works.length === 1) {
    const work = works[0]
    const { claims } = work
    const ordinal = claims['wdt:P1545'] && claims['wdt:P1545'][0]
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

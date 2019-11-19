// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { getNames, aggregateClaims } = require('./helpers')
const error_ = __.require('lib', 'error/error')
const assert_ = __.require('utils', 'assert_types')
const { snapshotValidations } = __.require('models', 'validations/item')
const getBestLangValue = __.require('lib', 'get_best_lang_value')

module.exports = {
  edition: (edition, works, authors, series) => {
    const lang = edition.originalLang || 'en'
    let title = edition.claims['wdt:P1476'] != null ? edition.claims['wdt:P1476'][0] : undefined
    const subtitle = edition.claims['wdt:P1680'] != null ? edition.claims['wdt:P1680'][0] : undefined
    // Wikidata editions might not have a wdt:P1476 value
    if (!title) { title = getBestLangValue(lang, null, edition.labels).value }
    const image = edition.image != null ? edition.image.url : undefined
    return buildOperation({
      type: 'edition',
      entity: edition,
      works,
      title,
      subtitle,
      lang,
      image,
      authors,
      series
    })
  },

  work: (work, authors, series) => {
    const { originalLang: lang } = work
    const title = getBestLangValue(lang, null, work.labels).value
    const image = work.claims['wdt:P18'] != null ? work.claims['wdt:P18'][0] : undefined
    const works = [ work ]
    return buildOperation({
      type: 'work',
      entity: work,
      works,
      title,
      lang,
      image,
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

  if (authorsNames != null) { snapshot['entity:authors'] = authorsNames }
  if (seriesNames != null) {
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
    const ordinal = work.claims['wdt:P1545'] != null ? work.claims['wdt:P1545'][0] : undefined
    if (ordinal != null) return snapshot['entity:ordinal'] = ordinal
  } else {
    const series = aggregateClaims(works, 'wdt:P179')
    // Aggregate ordinals only if works are from the same unique serie
    if (series.length === 1) {
      const ordinals = aggregateClaims(works, 'wdt:P1545')
      if (ordinals.length > 0) return snapshot['entity:ordinal'] = ordinals.join(',')
    }
  }
}

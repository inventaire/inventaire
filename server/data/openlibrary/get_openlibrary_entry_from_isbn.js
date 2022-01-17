const { normalizeIsbn } = require('lib/isbn/isbn')
const requests_ = require('lib/requests')
const { setEditionPublisherClaim } = require('data/lib/set_edition_publisher_claim')
const { prefixifyWd } = require('controllers/entities/lib/prefix')
const wdIdByIso6392Code = require('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')
const { compact } = require('lodash')

module.exports = async isbn => {
  const normalizedIsbn = normalizeIsbn(isbn)
  const url = `https://openlibrary.org/isbn/${normalizedIsbn}.json`
  const data = await requests_.get(url)
  data.works = data.works || []
  data.authors = data.authors || []
  const edition = getEditionSeed(normalizedIsbn, data)
  const [ works, authors ] = await Promise.all([
    Promise.all(data.works.map(getEntitySeedFromOlId)),
    Promise.all(data.authors.map(getEntitySeedFromOlId)),
  ])
  if (works.length === 1) {
    if (data.translated_from) {
      const languagesUris = compact(data.translated_from.map(parseLanguage))
      if (languagesUris.length > 0) works[0].claims['wdt:P407'] = languagesUris
    }
  }
  const publishers = data.publishers.map(getPublisherSeed)
  const entry = {
    edition,
    works,
    authors,
    publishers,
  }
  await setEditionPublisherClaim(entry)
  return entry
}

const getEditionSeed = (isbn, data) => {
  const edition = { isbn, claims: {} }
  edition.claims['wdt:P648'] = data.key.split('/').at(-1)
  if (data.languages) {
    const languagesUris = compact(data.languages.map(parseLanguage))
    if (languagesUris.length > 0) {
      edition.claims['wdt:P407'] = compact(data.languages.map(parseLanguage))
    }
  }
  if (data.number_of_pages) edition.claims['wdt:P1104'] = data.number_of_pages
  if (data.title) edition.claims['wdt:P1476'] = data.title
  if (data.subtitle) edition.claims['wdt:P1680'] = data.subtitle
  if (data.publish_date) {
    const day = parseSimpleDay(data.publish_date)
    if (day) edition.claims['wdt:P577'] = day
  }
  if (data.covers) {
    const coverId = data.covers[0]
    // See https://openlibrary.org/dev/docs/api/covers
    edition.image = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`
  }
  return edition
}

const getEntitySeedFromOlId = async ({ key }) => {
  const id = key.split('/').at(-1)
  const url = `https://openlibrary.org${key}.json`
  const { name, type, location, remote_ids: remoteIds = {} } = await requests_.get(url)
  // Ex: https://openlibrary.org/works/OL15331214W.json redirects to /works/OL14933414W
  if (type.key === '/type/redirect') {
    return getEntitySeedFromOlId({ key: location })
  }
  const seed = {
    labels: {},
    claims: {
      'wdt:P648': id
    }
  }
  if (name) seed.labels.en = name
  if (remoteIds.wikidata) seed.uri = prefixifyWd(remoteIds.wikidata)
  if (remoteIds.isni) seed.claims['wdt:P213'] = remoteIds.isni
  if (remoteIds.viaf) seed.claims['wdt:P214'] = remoteIds.viaf
  return seed
}

const getPublisherSeed = label => {
  return {
    labels: {
      en: label
    }
  }
}

const parseSimpleDay = dateString => {
  // The date might look like '1993' or 'Dec 25, 2017'
  // Forcing the time zone avoids getting the previous day
  // Ex: running `new Date('Dec 25, 2017')` on a CET machine returns `2017-12-24T23:00:00.000Z`
  const date = new Date(`${dateString} GMT`)
  // Do not return invalid dates
  if (date.toJSON() != null) {
    const day = date.toISOString().split('T')[0]
    if (dateString.match(yearPattern)) return day.split('-')[0]
    else return day
  }
}

const yearPattern = /^\d{4}$/

const parseLanguage = language => {
  const lang = language.key.split('/').at(-1)
  if (wdIdByIso6392Code[lang]) return prefixifyWd(wdIdByIso6392Code[lang])
}

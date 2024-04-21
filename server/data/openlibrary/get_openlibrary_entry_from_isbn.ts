import { compact } from 'lodash-es'
import { prefixifyWd } from '#controllers/entities/lib/prefix'
import { setEditionPublisherClaim } from '#data/lib/set_edition_publisher_claim'
import { normalizeIsbn } from '#lib/isbn/isbn'
import { requests_ } from '#lib/requests'
import { requireJson } from '#lib/utils/json'
import type { Url } from '#types/common'
import type { WdEntityUri } from '#types/entity'
import type { EditionLooseSeed, EntityLooseSeed } from '#types/resolver'

const wdIdByIso6392Code = requireJson('wikidata-lang/mappings/wd_id_by_iso_639_2_code.json')

export default async function (isbn) {
  const normalizedIsbn = normalizeIsbn(isbn)
  const url = `https://openlibrary.org/isbn/${normalizedIsbn}.json` as Url
  let data
  try {
    data = await requests_.get(url)
  } catch (err) {
    // No need to flood the logs with 404 html pages
    if (err.statusCode === 404) {
      delete err.context.resBody
      delete err.body
    }
    throw err
  }
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
    if (data.identifiers?.librarything?.[0]) {
      works[0].claims['wdt:P1085'] = data.identifiers.librarything[0]
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

function getEditionSeed (isbn, data) {
  const edition: EditionLooseSeed = { isbn, claims: {} }
  edition.claims['wdt:P648'] = data.key.split('/').at(-1)
  if (data.languages) {
    const languagesUris = compact(data.languages.map(parseLanguage))
    if (languagesUris.length > 0) {
      edition.claims['wdt:P407'] = compact(data.languages.map(parseLanguage))
    }
  }
  if (data.lccn) edition.claims['wdt:P1144'] = data.lccn[0]
  if (data.number_of_pages) edition.claims['wdt:P1104'] = data.number_of_pages
  if (data.title) edition.claims['wdt:P1476'] = data.title
  if (data.subtitle) edition.claims['wdt:P1680'] = data.subtitle
  if (data.publish_date) {
    const day = parseSimpleDay(data.publish_date)
    if (day) edition.claims['wdt:P577'] = day
  }
  const { identifiers = {}, covers } = data
  if (identifiers.goodreads?.[0]) edition.claims['wdt:P2969'] = identifiers.goodreads[0]
  if (covers) {
    const coverId = covers[0]
    // See https://openlibrary.org/dev/docs/api/covers
    edition.image = `https://covers.openlibrary.org/b/id/${coverId}-L.jpg?default=false`
  }
  return edition
}

async function getEntitySeedFromOlId ({ key }) {
  const id = key.split('/').at(-1)
  const url = `https://openlibrary.org${key}.json` as Url
  const { name, title, type, location, remote_ids: remoteIds = {} } = await requests_.get(url)
  // Ex: https://openlibrary.org/works/OL15331214W.json redirects to /works/OL14933414W
  if (type.key === '/type/redirect') {
    return getEntitySeedFromOlId({ key: location })
  }
  const seed: EntityLooseSeed = {
    labels: {},
    claims: {
      'wdt:P648': id,
    },
  }
  if (name || title) seed.labels.en = name || title
  if (remoteIds.wikidata) seed.uri = prefixifyWd(remoteIds.wikidata) as WdEntityUri
  if (remoteIds.isni) seed.claims['wdt:P213'] = remoteIds.isni
  if (remoteIds.viaf) seed.claims['wdt:P214'] = remoteIds.viaf
  return seed
}

function getPublisherSeed (label) {
  return {
    labels: {
      en: label,
    },
  }
}

function parseSimpleDay (dateString) {
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

function parseLanguage (language) {
  const lang = language.key.split('/').at(-1)
  if (wdIdByIso6392Code[lang]) return prefixifyWd(wdIdByIso6392Code[lang])
}

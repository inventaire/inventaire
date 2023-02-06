import _ from '#builders/utils'
import { error_ } from '#lib/error/error'
import { guessLangFromIsbn, isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'
import { requireJson } from '#lib/utils/json'
import sanitizeSeed from './sanitize_seed.js'

const wmLanguageCodeByWdId = requireJson('wikidata-lang/mappings/wm_code_by_wd_id.json')

// Validate : requires only one edition to resolve from and a valid isbn
// Format : if edition is a list, force pick the first edition
// Warn : when a property is unknown

export default entry => {
  let { edition } = entry

  if (_.isArray(edition)) {
    if (edition.length > 1) throw error_.new('multiple editions not supported', 400, { edition })
    else edition = entry.edition = edition[0]
  }

  if (edition == null) {
    throw error_.new('missing edition in entry', 400, { entry })
  }

  if (_.isPlainObject(entry.works)) entry.works = [ entry.works ]
  if (_.isPlainObject(entry.authors)) entry.authors = [ entry.authors ]

  entry.works = entry.works || []
  entry.authors = entry.authors || []

  if (Object.keys(edition).length === 0 && entry.works.length === 0) {
    throw error_.new('either edition or works should not be empty', 400, { entry })
  }

  if (entry.works.length === 0) {
    const work = createWorkSeedFromEdition(edition)
    if (work) entry.works = [ work ]
  }

  sanitizeEdition(entry.edition)
  sanitizeCollection(entry.authors, 'human')
  sanitizeCollection(entry.works, 'work')
  return entry
}

const sanitizeEdition = edition => {
  sanitizeSeed(edition, 'edition')

  const rawIsbn = getIsbn(edition)

  if (rawIsbn != null) {
    if (!isValidIsbn(rawIsbn)) throw error_.new('invalid isbn', 400, { edition })
    edition.isbn = normalizeIsbn(rawIsbn)
  }
}

const sanitizeCollection = (seeds, type) => seeds.forEach(seed => sanitizeSeed(seed, type))

const getIsbn = edition => {
  const { isbn, claims } = edition
  if (isbn) return isbn
  const isbnClaims = claims['wdt:P212'] || claims['wdt:P957']
  if (isbnClaims) return isbnClaims[0]
}

const createWorkSeedFromEdition = edition => {
  const { claims } = edition
  const title = claims?.['wdt:P1476'] ? _.forceArray(claims['wdt:P1476'])[0] : null
  if (title == null) return
  const langClaim = claims['wdt:P407'] && _.forceArray(claims['wdt:P407'])[0]
  const langWdId = langClaim ? langClaim.split(':')[1] : null
  const lang = wmLanguageCodeByWdId[langWdId] || guessLangFromIsbn(edition.isbn) || 'en'
  return {
    labels: {
      [lang]: title,
    },
  }
}

import { isPlainObject } from 'lodash-es'
import { isArray } from '#lib/boolean_validations'
import { newError } from '#lib/error/error'
import { guessLangFromIsbn, isValidIsbn, normalizeIsbn } from '#lib/isbn/isbn'
import { forceArray } from '#lib/utils/base'
import { requireJson } from '#lib/utils/json'
import { getClaimValue } from '#models/entity'
import type { ResolverEntry, SanitizedResolverEntry } from '#server/types/resolver'
import { sanitizeSeed } from './sanitize_seed.js'

const wmLanguageCodeByWdId = requireJson('wikidata-lang/mappings/wm_code_by_wd_id.json')

// Validate : requires only one edition to resolve from and a valid isbn
// Format : if edition is a list, force pick the first edition
// Warn : when a property is unknown

export function sanitizeEntry (entry: ResolverEntry) {
  let { edition } = entry

  if (isArray(edition)) {
    if (edition.length > 1) throw newError('multiple editions not supported', 400, { edition })
    // @ts-expect-error
    else edition = entry.edition = edition[0]
  }

  if (edition == null) {
    throw newError('missing edition in entry', 400, { entry })
  }

  // @ts-expect-error
  if (isPlainObject(entry.works)) entry.works = [ entry.works ]
  // @ts-expect-error
  if (isPlainObject(entry.authors)) entry.authors = [ entry.authors ]

  entry.works = entry.works || []
  entry.authors = entry.authors || []

  if (Object.keys(edition).length === 0 && entry.works.length === 0) {
    throw newError('either edition or works should not be empty', 400, { entry })
  }

  if (entry.works.length === 0) {
    const work = createWorkSeedFromEdition(edition)
    if (work) entry.works = [ work ]
  }

  sanitizeEdition(entry.edition)
  sanitizeCollection(entry.authors, 'human')
  sanitizeCollection(entry.works, 'work')
  return entry as SanitizedResolverEntry
}

function sanitizeEdition (edition) {
  sanitizeSeed(edition, 'edition')

  const rawIsbn = getIsbn(edition)

  if (rawIsbn != null) {
    if (!isValidIsbn(rawIsbn)) throw newError('invalid isbn', 400, { edition })
    edition.isbn = normalizeIsbn(rawIsbn)
  }
}

const sanitizeCollection = (seeds, type) => seeds.forEach(seed => sanitizeSeed(seed, type))

function getIsbn (edition) {
  const { isbn, claims } = edition
  if (isbn) return isbn
  const isbnClaims = claims['wdt:P212'] || claims['wdt:P957']
  if (isbnClaims) return isbnClaims[0]
}

function createWorkSeedFromEdition (edition) {
  const { claims } = edition
  const titleClaim = claims?.['wdt:P1476'] ? forceArray(claims['wdt:P1476'])[0] : null
  if (titleClaim == null) return
  const title = getClaimValue(titleClaim)
  if (title == null) return
  const langClaim = claims['wdt:P407'] && forceArray(claims['wdt:P407'])[0]
  const langWdId = langClaim ? langClaim.split(':')[1] : null
  const lang = wmLanguageCodeByWdId[langWdId] || guessLangFromIsbn(edition.isbn) || 'en'
  return {
    labels: {
      [lang]: title,
    },
  }
}

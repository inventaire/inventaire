import { getFirstClaimValue } from '#controllers/entities/lib/inv_claims_utils'
import { cache_ } from '#lib/cache'
import { normalizeIsbn } from '#lib/isbn/isbn'
import { requests_ } from '#lib/requests'
import { requireJson } from '#lib/utils/json'

const wmCodeByIso6392Code = requireJson('wikidata-lang/mappings/wm_code_by_iso_639_2_code.json')

const timeout = 10 * 1000

export async function getOpenLibrarySummary ({ claims, refresh }) {
  const id = getFirstClaimValue(claims, 'wdt:P648')
  const isbn13h = getFirstClaimValue(claims, 'wdt:P212')
  let link, url, property, key, cacheKey, claim
  if (id) {
    const lastLetter = id.slice(-1)[0]
    const section = openLibrarySectionByLetter[lastLetter]
    link = `https://openlibrary.org/${section}/${id}`
    url = `${link}.json`
    property = 'wdt:P648'
    key = property
    cacheKey = `summary:${key}:${id}`
    claim = { id, property }
  } else if (isbn13h) {
    const isbn13 = normalizeIsbn(isbn13h)
    link = `https://openlibrary.org/isbn/${isbn13}`
    url = `${link}.json`
    property = 'wdt:P212'
    key = `${property}:openlibrary`
    cacheKey = `summary:${key}:${isbn13}`
    claim = { id: isbn13h, property }
  } else {
    return
  }
  const res = await cache_.get({
    key: cacheKey,
    refresh,
    fn: async () => {
      try {
        const { bio, description, languages } = await requests_.get(url, { timeout })
        const text = bio || description
        if (!text) return
        let lang
        if (languages?.[0]) lang = parseLanguage(languages[0])
        if (text.value) {
          return { text: text.value, lang }
        } else if (typeof text === 'string') {
          return { text, lang }
        }
      } catch (err) {
        if (err.statusCode === 404) return
        // Prevent logging long HTML responses
        if (err.body?.includes('<html')) err.body = '[HTML response]'
        throw err
      }
    },
  })
  if (res?.text) {
    const { text, lang } = res
    return {
      text,
      name: 'OpenLibrary',
      link,
      key,
      lang: lang || 'en',
      claim,
    }
  }
}

const openLibrarySectionByLetter = {
  A: 'authors',
  W: 'works',
  M: 'books',
}

function parseLanguage (language) {
  const lang = language.key.split('/').at(-1)
  return wmCodeByIso6392Code[lang]
}

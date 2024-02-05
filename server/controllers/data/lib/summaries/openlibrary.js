import { cache_ } from '#lib/cache'
import { normalizeIsbn } from '#lib/isbn/isbn'
import { requests_ } from '#lib/requests'

const timeout = 10 * 1000

export async function getOpenLibrarySummary ({ claims, refresh }) {
  const id = claims['wdt:P648']?.[0]
  const isbn13h = claims['wdt:P212']?.[0]
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
  const text = await cache_.get({
    key: cacheKey,
    refresh,
    fn: async () => {
      const { bio, description } = await requests_.get(url, { timeout })
      const text = bio || description
      if (!text) return
      if (text.value) return text.value
      else if (typeof text === 'string') return text
    },
  })
  if (text) {
    return {
      text,
      name: 'OpenLibrary',
      link,
      key,
      lang: 'en',
      claim,
    }
  }
}

const openLibrarySectionByLetter = {
  A: 'authors',
  W: 'works',
  M: 'books',
}

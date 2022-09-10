const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const timeout = 10 * 1000

module.exports = async ({ id, refresh }) => {
  const lastLetter = id.slice(-1)[0]
  const section = openLibrarySectionByLetter[lastLetter]
  const link = `https://openlibrary.org/${section}/${id}`
  const url = `${link}.json`
  const property = 'wdt:P648'
  const text = await cache_.get({
    key: `summary:${property}:${id}`,
    refresh,
    fn: async () => {
      const { bio, description } = await requests_.get(url, { timeout })
      const text = bio || description
      if (!text) return
      if (text.value) return text.value
      else if (typeof text === 'string') return text
    }
  })
  if (text) {
    return {
      text,
      name: 'OpenLibrary',
      link,
      lang: 'en',
    }
  }
}

const openLibrarySectionByLetter = {
  A: 'authors',
  W: 'works',
  M: 'books',
}

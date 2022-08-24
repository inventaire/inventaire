const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const timeout = 10 * 1000

module.exports = async ({ claimValues, refresh }) => {
  const id = claimValues[0]
  const url = `https://openlibrary.org/any/${id}.json`
  const source = 'wdt:P648'
  const text = await cache_.get({
    key: `summary:${source}:${id}`,
    refresh,
    fn: async () => {
      const { bio, description } = await requests_.get(url, { timeout })
      const text = bio || description
      if (!text) return
      if (text.value) return text.value
      else if (typeof text === 'string') return text
    }
  })
  if (text) return { source, text }
}

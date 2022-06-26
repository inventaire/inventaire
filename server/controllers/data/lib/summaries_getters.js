const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const timeout = 10 * 1000

const summaryGettersByClaimProperty = {
  'wdt:P648': async claimValues => {
    const olId = claimValues[0]
    const url = `https://openlibrary.org/works/${olId}.json`
    const source = 'wdt:P648'
    const text = await cache_.get({
      key: `summary:${source}:${olId}`,
      fn: async () => {
        const { description } = await requests_.get(url, { timeout })
        if (!description) return
        if (description.value) return description.value
        else if (typeof description === 'string') return description
      }
    })
    if (text) return { source, text }
  }
}

const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)

module.exports = {
  summaryGettersByClaimProperty,
  propertiesWithGetters,
}

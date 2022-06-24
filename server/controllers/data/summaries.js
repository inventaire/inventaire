const getEntityByUri = require('controllers/entities/lib/get_entity_by_uri')
const requests_ = require('lib/requests')
const { keyBy, compact } = require('lodash')
const cache_ = require('lib/cache')

const sanitization = {
  uri: {}
}

const controller = async ({ uri }) => {
  const entity = await getEntityByUri({ uri })
  const summaries = await getSummariesFromClaims(entity.claims)
  return {
    summaries: keyBy(compact(summaries), 'source')
  }
}

const getSummariesFromClaims = async claims => {
  const propertiesWithGetters = Object.keys(summaryGettersByClaimProperty)
  return Promise.all(propertiesWithGetters.map(getSummaryFromPropertyClaims(claims)))
}

const getSummaryFromPropertyClaims = claims => property => {
  const claimValues = claims[property]
  if (claimValues) {
    return summaryGettersByClaimProperty[property](claimValues)
  }
}

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

const timeout = 10 * 1000

module.exports = { sanitization, controller }

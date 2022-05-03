const _ = require('builders/utils')
const requests_ = require('lib/requests')
const cache_ = require('lib/cache')
const { oneMonth } = require('lib/time')
const { buildUrl } = require('lib/utils/url')
const timespan = 3 * oneMonth

module.exports = (name, endpoint, getQuery, requestOptions) => id => {
  const key = `${name}:author-works-titles:${id}`
  return cache_.get({
    key,
    fn: makeRequest.bind(null, endpoint, getQuery(id), requestOptions),
    timespan
  })
  .catch(err => {
    _.error(err, `${name} error fetching ${id}`)
    return []
  })
}

const makeRequest = async (endpoint, query, requestOptions = {}) => {
  requestOptions.headers = { accept: 'application/sparql-results+json' }
  requestOptions.timeout = 5000
  const url = buildUrl(endpoint, { query })
  const { results } = await requests_.get(url, requestOptions)
  return results.bindings.map(parseResult)
}

const parseResult = result => ({
  title: result.title && result.title.value,
  url: result.work && result.work.value
})

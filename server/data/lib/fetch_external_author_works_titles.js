const _ = require('builders/utils')
const requests_ = require('lib/requests')
const { fixedEncodeURIComponent } = require('lib/utils/url')
const cache_ = require('lib/cache')
const { oneMonth } = require('lib/time')
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
  const escapedQuery = fixedEncodeURIComponent(query)
  const base = `${endpoint}?query=`
  requestOptions.headers = { accept: 'application/sparql-results+json' }
  requestOptions.timeout = 5000
  const url = base + escapedQuery

  const { results } = await requests_.get(url, requestOptions)
  return results.bindings.map(parseResult)
}

const parseResult = result => ({
  title: result.title && result.title.value,
  url: result.work && result.work.value
})

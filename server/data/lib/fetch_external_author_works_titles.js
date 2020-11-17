const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const requests_ = __.require('lib', 'requests')
const qs = require('querystring')
const cache_ = __.require('lib', 'cache')
const { oneMonth } = __.require('lib', 'time')
const timespan = 3 * oneMonth

module.exports = (name, endpoint, getQuery) => id => {
  const key = `${name}:author-works-titles:${id}`
  return cache_.get({
    key,
    fn: makeRequest.bind(null, endpoint, getQuery(id), id),
    timespan
  })
  .catch(err => {
    _.error(err, `${name} error fetching ${id}`)
    return []
  })
}

const makeRequest = async (endpoint, query) => {
  const escapedQuery = qs.escape(query)
  const base = `${endpoint}?query=`
  const headers = { accept: 'application/sparql-results+json' }
  const url = base + escapedQuery

  const { results } = await requests_.get(url, { headers })
  return results.bindings.map(parseResult)
}

const parseResult = result => ({
  title: result.title && result.title.value,
  url: result.work && result.work.value
})

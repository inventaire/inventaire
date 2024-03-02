import { cache_ } from '#lib/cache'
import { requests_ } from '#lib/requests'
import { oneMonth } from '#lib/time'
import { logError } from '#lib/utils/logs'
import { buildUrl } from '#lib/utils/url'

export default (name, endpoint, getQuery, requestOptions = {}) => async id => {
  try {
    return await cache_.get({
      key: `${name}:author-works-titles:${id}`,
      fn: makeRequest.bind(null, endpoint, getQuery(id), requestOptions),
      ttl: oneMonth,
    })
  } catch (err) {
    logError(err, `${name} error fetching ${id}`)
    return []
  }
}

const makeRequest = async (endpoint, query, requestOptions) => {
  requestOptions.headers = { accept: 'application/sparql-results+json' }
  requestOptions.timeout = 5000
  const url = buildUrl(endpoint, { query })
  const { results } = await requests_.get(url, requestOptions)
  return results.bindings.map(parseResult)
}

const parseResult = result => ({
  title: result.title && result.title.value,
  url: result.work && result.work.value,
})

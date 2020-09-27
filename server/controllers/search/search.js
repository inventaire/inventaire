const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const parseResults = require('./lib/parse_results')
const normalizeResult = require('./lib/normalize_result')
const boostByPopularity = require('./lib/boost_by_popularity')
const { possibleTypes } = require('./lib/indexes')
const typeSearch = require('./lib/type_search')
const sanitize = __.require('lib', 'sanitize/sanitize')
const Group = __.require('models', 'group')

const sanitization = {
  search: {},
  lang: {},
  types: { allowlist: possibleTypes },
  limit: { default: 10, max: 100 }
}

module.exports = {
  get: (req, res) => {
    sanitize(req, res, sanitization)
    .then(params => {
      const { types, search, lang, limit, reqUserId } = params
      // Extend the search to the next 10 results, so that the popularity boost
      // can save some good results a bit further down the limit
      return typeSearch(lang, types, search, limit + 10)
      .then(parseResults(types))
      .then(results => {
        return results
        .filter(isSearchable(reqUserId))
        .map(normalizeResult(lang))
      })
      .then(boostByPopularity)
      .then(results => results.slice(0, limit))
    })
    .then(responses_.Wrap(res, 'results'))
    .catch(error_.Handler(req, res))
  }
}

const isSearchable = reqUserId => result => {
  const source = result._source
  if (source.type === 'user') {
    return source.deleted !== true
  } else if (source.type === 'group') {
    if (source.searchable) return true
    if (reqUserId == null) return false
    // Only members should be allowed to find non-searchable groups in search
    return Group.userIsMember(reqUserId, source)
  } else {
    return true
  }
}

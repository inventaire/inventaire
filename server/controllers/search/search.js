const CONFIG = require('config')
const __ = CONFIG.universalPath
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const parseResults = require('./lib/parse_results')
const normalizeResults = require('./lib/normalize_results')
const boostByPopularity = require('./lib/boost_by_popularity')
const { possibleTypes } = require('./lib/types')
const typeSearch = require('./lib/type_search')
const sanitize = __.require('lib', 'sanitize/sanitize')
const Group = __.require('models', 'group')

const sanitization = {
  search: {},
  lang: {},
  types: { whitelist: possibleTypes },
  limit: { default: 10, max: 100 }
}

module.exports = {
  get: (req, res) => {
    return sanitize(req, res, sanitization)
    .then(params => {
      const { types, search, lang, limit, reqUserId } = params
      // Extend the search to the next 10 results, so that the popularity boost
      // can save some good results a bit further down the limit
      return typeSearch(types, search, limit + 10)
      .then(parseResults(types))
      .filter(isSearchable(reqUserId))
      .then(normalizeResults(lang))
      .then(boostByPopularity)
      .then(results => results.slice(0, limit))
    })
    .then(responses_.Wrap(res, 'results'))
    .catch(error_.Handler(req, res))
  }
}

const isSearchable = reqUserId => result => {
  if (result._type !== 'groups') return true
  if (result._source.searchable) return true
  if (reqUserId == null) return false
  // Only members should be allowed to find non-searchable groups in search
  return Group.userIsMember(reqUserId, result._source)
}

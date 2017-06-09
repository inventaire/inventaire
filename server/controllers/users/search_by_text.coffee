__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ buildSearcher } = __.require 'lib', 'elasticsearch'

module.exports = (req, res) ->
  { query } = req
  search = query.search?.trim()

  unless _.isNonEmptyString search
    return error_.bundleInvalid req, res, 'search', search

  searchByText search
  .then _.Wrap(res, 'users')
  .catch error_.Handler(req, res)

searchByText = buildSearcher
  dbBaseName: 'users'
  queryBodyBuilder: (search)->
    should = [
      # Username
      { match: { username: { query: search, boost: 5 } } }
      { match_phrase_prefix: { username: { query: search, boost: 4 } } }
      { fuzzy: { username: search } }
      # Bio
      { match: { bio: search } }
    ]

    return { query: { bool: { should } } }

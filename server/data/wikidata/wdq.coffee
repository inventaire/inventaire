__ = require('config').root
_ = __.require 'builders', 'utils'
cache_ = __.require 'lib', 'cache'

promises_ = __.require 'lib', 'promises'
wd_ = __.require 'lib', 'wikidata'

module.exports = (res, query, P, Q)->
  try _.types [query, P, Q], 'strings...'
  catch err
    _.error err, 'wdq err'
    return _.errorHandler(res, 'bad parameters', 400)

  key = "wdq:#{query}:#{P}:#{Q}"
  cache_.get key, requestWdq.bind(null, query, P, Q)
  .then res.json.bind(res)
  .catch _.errorHandler.bind(null, res)

requestWdq = (query, P, Q)->
  switch query
    when 'claim' then return claim(P,Q)
    else throw new Error "#{query} requestWdq isnt implemented"

claim = (P, Q)->
  url = wd_.API.wmflabs.claim(P, Q)
  promises_.get url

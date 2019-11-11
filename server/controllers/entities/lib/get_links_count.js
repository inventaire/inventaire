# Get the amount of entities linking to a given entity

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
entities_ = require './entities'
runWdQuery = __.require 'data', 'wikidata/run_query'

module.exports = (uri, refresh)->
  [ prefix, id ] = uri.split ':'
  promises = []

  if prefix is 'wd' then promises.push getWdLinksScore(id, refresh)

  promises.push getLocalLinksCount(uri)

  promises_.all promises
  .then _.sum
  .catch _.ErrorRethrow('get links count err')

getWdLinksScore = (qid, refresh)->
  runWdQuery { query: 'links-count', qid, refresh }
  .then _.first

getLocalLinksCount = (uri)-> entities_.byClaimsValue uri, true

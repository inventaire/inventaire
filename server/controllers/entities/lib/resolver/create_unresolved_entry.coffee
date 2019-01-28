CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
createEntity = require '../create_entity'

module.exports = (entry, userId)->
  { works, authors } = entry
  authorsUris = _.compact(authors.map _.property('uri'))
  Promise.all works.map (work)->
    labels = work.labels
    createWorkEntity labels, authorsUris, userId
    .then (createdWork)->
      work.uri = "inv:#{createdWork._id}"


createWorkEntity = (labels, authorsUris, userId)->
  unless _.isNonEmptyPlainObject(labels) then return
  claims =
    'wdt:P31': [ 'wd:Q571' ]
    'wdt:P50': authorsUris

  return createEntity labels, claims, userId
  .then _.Log('created work entity')
  .catch _.ErrorRethrow('createWorkEntity err')

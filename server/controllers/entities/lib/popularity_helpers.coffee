__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getLinksCount = require './get_links_count'

module.exports =
  oneUriSeveralFunctions: (functions...)->
    # getLinksCount is common to all aggregated types
    functions.push getLinksCount
    return (uri)->
      Promise.all functions.map((fn)-> fn(uri))
      .then _.sum

  severalUrisOneFunction: (fn)-> (uris)->
    Promise.all uris.map(fn)
    .then _.sum

  getUri: _.property 'uri'

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'

module.exports =
  oneUriSeveralFunctions: (functions...)-> (uri)->
    Promise.all functions.map((fn)-> fn(uri))
    .then _.sum

  severalUrisOneFunction: (fn)-> (uris)->
    Promise.all uris.map(fn)
    .then _.sum

  getUri: _.property 'uri'

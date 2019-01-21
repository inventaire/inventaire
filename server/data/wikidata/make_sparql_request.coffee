__ = require('config').universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
wdk = require 'wikidata-sdk'

module.exports = (sparql)->
  url = wdk.sparqlQuery sparql
  requests_.get url
  .then wdk.simplifySparqlResults

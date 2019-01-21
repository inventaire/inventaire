CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
requests_ = __.require 'lib', 'requests'
wdk = require 'wikidata-sdk'
requestOptions =
  headers:
    # Required to avoid getting a 403
    # See https://meta.wikimedia.org/wiki/User-Agent_policy
    'user-agent': CONFIG.name

module.exports = (sparql)->
  url = wdk.sparqlQuery sparql
  requests_.get url, requestOptions
  .then wdk.simplifySparqlResults

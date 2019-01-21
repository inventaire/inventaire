CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
properties = require '../properties/properties_values_constraints'
makeSparqlRequest = __.require 'data', 'wikidata/make_sparql_request'
{ prefixifyWd, prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'
entities_ = __.require 'controllers', 'entities/lib/entities'
runWdQuery = __.require 'data', 'wikidata/run_query'

module.exports = (claims)->
  externalIds = []

  for prop, values of claims
    if properties[prop].isExternalId
      values.forEach (value)-> externalIds.push [ prop, value ]

  if externalIds.length is 0 then return Promise.resolve()

  Promise.all [
    wdQuery externalIds
    invQuery externalIds
  ]
  .then _.flatten

wdQuery = (externalIds)->
  runWdQuery { query: 'resolve-external-ids', externalIds }
  .map prefixifyWd

invQuery = (externalIds)->
  Promise.all externalIds.map(invByClaim)
  .then _.flatten

invByClaim = (pair)->
  [ prop, value ] = pair
  entities_.byClaim prop, value
  .then (res)-> _.map(res.rows, 'id').map prefixifyInv

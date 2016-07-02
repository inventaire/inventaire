__ = require('config').universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'

searchWikidataEntities = __.require 'data', 'wikidata/entities'

# Filter use WDQ syntax
# ex: P31:Q5, the property and object
# in the triple subject-property-object
whitelistedProps = [ 'P31' ]
whitelistedObjects = [ 'Q5' ]

module.exports = (query, res)->
  { search, filter, language } = query

  _.log query, 'filtered search'
  [ prop, obj ] = filter.split ':'

  promises_.try -> validateFilter query, filter
  .then -> searchWikidataEntities query
  .filter Filter(filter)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

validateFilter = (query, filter)->
  [ prop, obj ] = filter.split ':'
  unless /^P\d+$/.test prop
    throw error_.new 'invalid filter property', 400, query

  # allow to pass up to 10 qids
  unless /^(Q\d+,){0,9}(Q\d+)$/.test obj
    throw error_.new 'invalid filter object(s)', 400, query

  unless prop in whitelistedProps
    throw error_.new 'non-whitelisted filter property', 400, query

  unless obj in whitelistedObjects
    throw error_.new 'non-whitelisted filter object', 400, query

Filter = (filter)->
  [ prop, obj ] = filter.split ':'
  obj = obj.split ','
  filterFn = (entity)->
    claims = entity.claims[prop]
    unless claims? then return false
    simplifiedClaims = wdk.simplifyPropertyClaims claims
    _.log obj, 'obj'
    _.log simplifiedClaims, 'simplifiedClaims'
    return _.haveAMatch obj, simplifiedClaims

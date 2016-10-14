__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = require '../promises'
wdk = require 'wikidata-sdk'
wd_ = __.require('sharedLibs', 'wikidata')(promises_, _, wdk)
qs = require 'querystring'

searchEntities = (search)->
  search = qs.escape search
  url = wd_.API.wikidata.search search
  _.log url, 'searchEntities'
  return promises_.get url

unprefixifyPropertyId = (value)-> value.replace 'wdt:', ''

module.exports = _.extend wd_,
  searchEntities: searchEntities
  unprefixifyPropertyId: unprefixifyPropertyId

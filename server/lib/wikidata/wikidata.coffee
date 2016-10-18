__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = require '../promises'
wdk = require 'wikidata-sdk'
wd_ = __.require('sharedLibs', 'wikidata')(promises_, _)
qs = require 'querystring'

searchEntities = (search)->
  search = qs.escape search
  url = wd_.API.wikidata.search search
  _.log url, 'searchEntities'
  return promises_.get url

getEntities = (ids, languages, props)->
  url = wdk.getEntities ids.map(unprefixifyEntityId), languages, props
  return promises_.get url

unprefixifyPropertyId = (value)-> value.replace 'wdt:', ''

module.exports = _.extend wd_,
  searchEntities: searchEntities
  getEntities: getEntities
  unprefixifyPropertyId: unprefixifyPropertyId

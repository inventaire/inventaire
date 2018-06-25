__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = require '../promises'
wdk = require 'wikidata-sdk'
wd_ = __.require('sharedLibs', 'wikidata')(promises_, _)

isWdEntityUri = (uri)->
  unless _.isNonEmptyString uri then return false
  [ prefix, id ] = uri?.split ':'
  return prefix is 'wd' and wdk.isItemId(id)

module.exports = _.extend wd_, { isWdEntityUri }

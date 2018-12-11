__ = require('config').universalPath
_ = __.require 'builders', 'utils'
wdk = require 'wikidata-sdk'

module.exports = helpers =
  isWdEntityUri: (uri)->
    unless _.isNonEmptyString uri then return false
    [ prefix, id ] = uri?.split ':'
    return prefix is 'wd' and wdk.isItemId(id)

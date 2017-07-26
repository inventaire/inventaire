__ = require('config').universalPath
_ = __.require('builders', 'utils')
promises_ = require '../promises'
wdk = require 'wikidata-sdk'
wd_ = __.require('sharedLibs', 'wikidata')(promises_, _)

getEntities = (ids, languages, props)->
  url = wdk.getEntities ids.map(unprefixifyEntityId), languages, props
  return promises_.get url

module.exports = _.extend wd_, { getEntities }

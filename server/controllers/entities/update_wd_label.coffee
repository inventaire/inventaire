CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
wdEdit = require 'wikidata-edit'
{ wikidataOAuth } = CONFIG

module.exports = (user, id, lang, value)->
  { oauth } = user
  userWikidataOAuth = user.oauth?.wikidata
  unless userWikidataOAuth?
    return error_.reject 'missing wikidata oauth tokens', 400

  unless wdk.isItemId id then return error_.rejectInvalid 'id', id

  oauth = _.extend userWikidataOAuth, wikidataOAuth

  return wdEdit({ oauth }, 'label/set')(id, lang, value)

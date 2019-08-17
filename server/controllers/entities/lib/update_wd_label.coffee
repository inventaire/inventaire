CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
wdk = require 'wikidata-sdk'
wdEdit = require 'wikidata-edit'
wdOauth = require './wikidata_oauth'

module.exports = (args...)-> Promise.try -> updateWdLabel args...

updateWdLabel = (user, id, lang, value)->
  unless wdk.isItemId id then throw error_.newInvalid 'id', id

  wdOauth.validate user
  oauth = wdOauth.getFullCredentials user

  return wdEdit({ oauth }, 'label/set')(id, lang, value)

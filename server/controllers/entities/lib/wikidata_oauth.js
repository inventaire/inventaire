CONFIG = require('config')
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
{ wikidataOAuth } = CONFIG

module.exports =
  validate: (user)->
    userWikidataOAuth = user.oauth?.wikidata
    unless userWikidataOAuth?
      throw error_.new 'missing wikidata oauth tokens', 400

  getFullCredentials: (user)-> _.extend {}, wikidataOAuth, user.oauth.wikidata

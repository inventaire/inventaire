CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getEntitiesList = require '../get_entities_list'

module.exports = (workUris)->
  getEntitiesList workUris
  .then getAuthorUris
  .then _.flatten
  .then _.compact
  .then getEntitiesList

getAuthorUris = (works)->
  works.map (work)-> work.claims['wdt:P50']

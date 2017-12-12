__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
getEntitiesByUris = require './lib/get_entities_by_uris'
addRelatives = require './lib/add_relatives'
whitelistedRelativesProperties = [
  'wdt:P50'
]

module.exports = (req, res, next)->
  { uris, refresh, relatives } = req.query
  # Accept URIs in a POST body
  uris or= req.body?.uris

  unless _.isNonEmptyString(uris) or _.isNonEmptyArray(uris)
    return error_.bundleMissingQuery req, res, 'uris'

  # Include a 'relatives' parameter to request to include entities
  # that you know in advance you will need. For instance, when requesting
  # works, you can request to have their authors entities directly included
  # before even knowning the authors URIs: relatives=wdt:P50
  if relatives?
    relatives = relatives.split '|'
    _.log relatives, 'include relative entities'
    for relative in relatives
      unless relative in whitelistedRelativesProperties
        return error_.bundleInvalid req, res, 'relative', relative

  if _.isString uris then uris = uris.split '|'

  uris = _.uniq uris

  refresh = _.parseBooleanString refresh

  getEntitiesByUris uris, refresh
  .then addRelatives(relatives, refresh)
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

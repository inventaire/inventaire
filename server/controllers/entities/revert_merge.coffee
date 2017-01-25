__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
patches_ = require './lib/patches'
entities_ = require './lib/entities'

module.exports = (req, res)->
  { body } = req
  { from:fromUri } = body
  { _id:userId } = req.user

  unless _.isNonEmptyString fromUri
    return error_.bundle req, res, "missing parameter: from", 400, body

  [ fromPrefix, fromId ] = fromUri.split ':'

  unless fromPrefix is 'inv' and _.isInvEntityId fromId
    return error_.bundle req, res, "invalid 'from' uri", 400, body

  revertToVersionBeforeRedirection userId, fromId
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

revertToVersionBeforeRedirection = (userId, entityId)->
  patches_.getSnapshots entityId
  .then findVersionBeforeRedirect
  .then (targetVersion)->
    entities_.byId entityId
    .then (currentVersion)->
      targetVersion._id = currentVersion._id
      targetVersion._rev = currentVersion._rev
      entities_.putUpdate userId, currentVersion, targetVersion

findVersionBeforeRedirect = (patches)->
  versions = patches.map _.property('snapshot')
  lastVersion = _.last versions
  unless lastVersion.redirect?
    throw error_.new "last version isn't a redirection", 400, lastVersion

  return versions
  .filter isntRedirection
  # Take the last
  .slice(-1)[0]

isntRedirection =  (version)-> not version.redirect?

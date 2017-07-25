__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
refreshSnapshot = require './lib/snapshot/refresh_snapshot'

module.exports = (req, res)->
  { uris } = req.body

  unless _.isArray uris
    return error_.bundleInvalid req, res, 'uris', uris

  refreshSequentially uris
  .then _.Ok(res)
  .catch error_.Handler(req, res)

refreshSequentially = (uris)->
  refreshNext = ->
    nextUri = uris.pop()

    unless nextUri? then return promises_.resolved

    unless _.isEntityUri nextUri
      _.warn nextUri, 'invalid entity URI: not refreshing'
      return refreshNext()

    _.log nextUri, 'next URI for items snapshot refresh'

    refreshSnapshot.fromUri nextUri
    # Space refreshes to lower stress on production resources
    .delay 100
    .then refreshNext

  return refreshNext()

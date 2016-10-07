__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (req, res, err, status)->
  # only accepts Error instances
  unless err instanceof Error
    _.error err, 'bad error object'
    return res.status(500).send(err)

  # if a status code was attached to the error, use it
  status or= err.status or 500

  err.user = _.pick req.user, ['_id', 'username']
  err.referer = req.headers.referer

  if /^4/.test status then _.warn err, status
  else _.error err, err.message

  res.status status
  res.json
    status: status
    status_verbose: err.message

  return
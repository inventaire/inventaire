__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (req, res, err, status)->
  # only accepts Error instances
  unless err instanceof Error
    _.error err, 'bad error object'
    return res.status(500).send(err)

  # if a status code was attached to the error, use it
  statusCode = err.statusCode or 500

  err.user = _.pick req.user, ['_id', 'username']
  err.referer = req.headers.referer

  if /^4/.test statusCode then _.warn err, statusCode
  else _.error err, err.message

  res.status statusCode
  res.json
    status: statusCode
    status_verbose: err.message
    context: err.context

  return

__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (res, err, status)->

  # only accepts Error instances
  unless err instanceof Error
    _.error err, 'bad error object'
    return res.status(500).send(err)

  # if a status code was attached to the error, use it
  status or= err.status or 500

  if /^4/.test status then _.warn err, status
  else _.error err, err.message

  res.setHeader 'Content-Type', 'application/json'
  res.status status
  res.json
    status_verbose: err.message

  return
__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (res, err, status)->

  # only accepts Error instances
  unless err instanceof Error
    err = new Error('bad error object')
    _.error err, err.message
    return res.status(500).send(err.message)

  # if a status code was attached to the error, use it
  status or= err.status or 500

  if /^4/.test status then _.warn err, status
  else _.error err, err.message

  res.setHeader 'Content-Type', 'application/json'
  res.status status
  res.json
    status_verbose: err.message

  return
__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
emailValidation = require './email_validation'

exports.get = (req, res, next)->
  {service} = req.query
  switch service
    when 'email-validation' then return emailValidation req, res
    else error_.bundle res, 'unknown service', 400, service

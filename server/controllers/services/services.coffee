__ = require('config').root
_ = __.require 'builders', 'utils'

emailValidation = require './email_validation'

module.exports.get = (req, res, next)->
  {service} = req.query
  switch service
    when 'email-validation' then return emailValidation(req, res, next)
    else _.errorHandler res, "unknown service: #{service}", 400

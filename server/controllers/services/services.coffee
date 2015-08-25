__ = require('config').root
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
emailValidation = require './email_validation'
parseEmails = require './parse_emails'

exports.get = (req, res, next)->
  {service} = req.query
  switch service
    when 'email-validation' then return emailValidation req, res
    else error_.bundle res, 'unknown service', 400, service

exports.post = (req, res, next)->
  {service} = req.query
  switch service
    when 'parse-emails' then return parseEmails req, res
    else error_.bundle res, 'unknown service', 400, service

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ emailValidation, offline } = CONFIG
{ activated, mailgunPubkey } = emailValidation
qs = require 'querystring'

module.exports = (req, res)->
  if offline or not activated
    # faking a valid email if not activated
    return bypassValidation res

  { email } = req.query
  email = qs.unescape email
  unless email?
    return error_.bundle req, res, "missing email in query", 400

  validateEmail email
  .then logIfInvalid
  .then res.json.bind(res)
  .catch error_.Handler(req, res)

endpoint = "https://api:#{mailgunPubkey}@api.mailgun.net/v2/address/validate"

validateEmail = (email)->
  email = qs.escape email
  promises_.get "#{endpoint}?address=#{email}"

bypassValidation = (res, email)->
  _.log email, 'by-passing email validation'
  res.json { is_valid: true }

logIfInvalid = (res)->
  unless res.is_valid then _.warn res, 'invalid email'
  return res
CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ emailValidation } = CONFIG
{ activated, mailgunPubkey } = emailValidation

module.exports = (req, res)->
  unless activated
    # faking a valid email if not activated
    return res.json { is_valid: true }

  {email} = req.query
  unless email?
    return error_.bundle res, "missing email in query", 400

  validateEmail(email)
  .then res.json.bind(res)
  .catch error_.Handler(res)


endpoint = "https://api:#{mailgunPubkey}@api.mailgun.net/v2/address/validate"

validateEmail = (email)->
  promises_.get "#{endpoint}?address=#{email}"

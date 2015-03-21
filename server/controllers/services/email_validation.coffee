CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next)->
  {email} = req.query
  unless email?
    return error_.bundle res, "missing email in query", 400

  validateEmail(email)
  .then res.json.bind(res)
  .catch error_.Handler(res)


endpoint = "https://api:#{CONFIG.mailgun.pubkey}@api.mailgun.net/v2/address/validate"

validateEmail = (email)->
  promises_.get "#{endpoint}?address=#{email}"

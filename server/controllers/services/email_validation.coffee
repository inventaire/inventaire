CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'

module.exports = (req, res, next)->
  {email} = req.query
  unless email?
    return _.errorHandler res, "missing email in query", 400

  validateEmail(email)
  .then res.json.bind(res)
  .catch _.errorHandler.bind(_, res)


endpoint = "https://api:#{CONFIG.mailgun.pubkey}@api.mailgun.net/v2/address/validate"

validateEmail = (email)->
  promises_.get "#{endpoint}?address=#{email}"

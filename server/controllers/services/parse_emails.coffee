CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ parseAddressList } = require 'email-addresses'

module.exports = (req, res)->
  { emails } = req.body

  _.log req.body, 'req.body'

  unless _.isString emails
    return error_.bundle res, "missing emails string in body", 400

  _.log emails, 'raw emails'

  promises_.start()
  .then parseEmails.bind(null, emails)
  .then _.Log('parsed emails')
  .then res.json.bind(res)
  .catch error_.Handler(res)

parseEmails = (emails)->
  emails = parseAddressList emails
    .map _.property('address')
    .map _.toLowerCase

  return _.uniq emails


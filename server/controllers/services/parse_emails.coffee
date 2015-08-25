CONFIG = require 'config'
__ = CONFIG.root
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
error_ = __.require 'lib', 'error/error'
{ parseAddressList } = require 'email-addresses'

module.exports = (req, res)->
  { emails } = req.body

  unless _.isString emails
    return error_.bundle res, "missing emails string in body", 400

  promises_.start()
  .then parseEmails.bind(null, emails)
  .then res.json.bind(res)
  .catch error_.Handler(res)

parseEmails = (emails)->
  emails = prepareEmails emails
  parsedEmails = parseAddressList emails
  unless parsedEmails?
    throw error_.new "couldn't parse emails", 400, emails

  _(parsedEmails)
  .map _.property('address')
  .map _.toLowerCase
  .uniq()
  .value()

# providing to 'email-addresses' known limitations
prepareEmails = (emails)->
  # deleting a possible trailing coma or semi-colon
  emails.replace /(,|;)$/, ''

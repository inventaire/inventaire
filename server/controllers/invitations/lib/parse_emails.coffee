__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ parseAddressList } = require 'email-addresses'
error_ = __.require 'lib', 'error/error'

module.exports = (emails, userEmail)->
  emailsString = if _.isArray(emails) then emails.join(',') else emails

  unless _.isNonEmptyString emailsString
    throw error_.newMissingBody 'emails'

  parsedEmails = parseAddressList prepareEmails(emailsString)

  unless parsedEmails?
    throw error_.new "couldn't parse emails", 400, emails

  _(parsedEmails)
  .map _.property('address')
  .map _.toLowerCase
  .uniq()
  .without userEmail.toLowerCase()
  .value()

# providing to 'email-addresses' known limitations
prepareEmails = (emails)->
  emails.trim()
  # Replace line breaks, tabs, semi-colons by a comma
  .replace /(\n|\t|;)/g, ','
  # Replace successive commas
  .replace /,,/g, ','
  # Delete a possible trailing comma
  .replace /,$/, ''

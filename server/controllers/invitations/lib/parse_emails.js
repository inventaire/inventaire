__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ parseAddressList } = require 'email-addresses'
error_ = __.require 'lib', 'error/error'

# Takes a string (or an array) containing email addresses
# (typically, the value of a text input filled with emails by a user)
# and returns an array of parsed emails addresses
module.exports = (emails)->
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

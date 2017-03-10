__ = require('config').universalPath
_ = __.require 'builders', 'utils'
{ parseAddressList } = require 'email-addresses'
error_ = __.require 'lib', 'error/error'

module.exports = (emails, userEmail)->
  unless _.isString emails
    throw error_.newMissingParameter 'body', 'emails'

  emails = prepareEmails emails
  parsedEmails = parseAddressList emails
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
  # deleting a possible trailing coma or semi-colon
  .replace /(,|;)$/, ''
  # deleting line breaks and tabs
  .replace /(\n|\t)/g, ''

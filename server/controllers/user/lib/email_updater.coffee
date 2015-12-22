__ = require('config').universalPath
_ = __.require 'builders', 'utils'

module.exports = (user_)->
  return emailUpdater = (attribute, value, doc)->
    doc = archivePreviousEmail doc
    doc.email = value
    # returns a user doc
    return user_.sendValidationEmail doc

archivePreviousEmail = (doc)->
  # don't save the previous email if it had not been validated
  if doc.validEmail
    doc.previousEmails or= []
    doc.previousEmails.push doc.email
    doc.previousEmails = _.uniq doc.previousEmails
    doc.validEmail = false
  return doc

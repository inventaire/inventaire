CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
tests = __.require 'models','tests/common-tests'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

create = (inviterId, email)->
  tests.pass 'email', email
  return addInviter inviterId, baseDoc(email)

baseDoc = (email)->
  type: 'invited'
  email: email
  inviters: {}

# update function
addInviter = (inviterId, doc)->
  # the doc shouldnt be updated if the inviter already did invited
  # but in the undesired case it happens, keep the first timestamp
  doc.inviters[inviterId] or= Date.now()
  return doc


# The stopEmails flag is added with scripts/lib/stop_emails.coffee
# to users sending an email at stop-email@inventaire.io
# or reporting inventaire.io emails as spam.
# This could be made more secure and automated
# by sending an unsubscribe link with a token
stopEmails = BasicUpdater 'stopEmails', true

canBeInvited = (inviterId, doc)->
  { inviters, stopEmails } = doc
  if stopEmails
    _.warn [inviterId, doc], 'stopEmails: invitation aborted'
    return false

  alreadyInvited = inviters[inviterId]?
  if alreadyInvited
    _.warn [inviterId, doc], 'alreadyInvited: invitation aborted'
    return false

  return true

module.exports =
  create: create
  addInviter: addInviter
  canBeInvited: canBeInvited
  stopEmails: stopEmails

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
validations = __.require 'models', 'validations/common'
{ BasicUpdater } = __.require 'lib', 'doc_updates'

create = (inviterId, groupId)-> (email)->
  validations.pass 'email', email
  return addInviter inviterId, groupId, baseDoc(email)

baseDoc = (email)->
  type: 'invited'
  email: email
  inviters: {}

addInviter = (inviterId, groupId, doc)->
  # The doc shouldn't be updated if the inviter already did invited
  # but in the undesired case it happens, keep the first timestamp
  doc.inviters[inviterId] or= Date.now()
  if groupId?
    # doc.inviters and doc.invitersGroups are kept on the user document
    # by User.upgradeInvited, thus the heavy but explicit 'invitersGroups' name
    doc.invitersGroups or= {}
    doc.invitersGroups[groupId] = inviterId
  return doc

# The stopEmails flag is added with scripts/lib/stop_emails.coffee
# to users sending an email at stop-email@inventaire.io
# or reporting inventaire.io emails as spam.
# This could be made more secure and automated
# by sending an unsubscribe link with a token
stopEmails = BasicUpdater 'stopEmails', true

canBeInvited = (inviterId, groupId)-> (doc)->
  if doc.stopEmails
    _.warn [ inviterId, doc ], 'stopEmails: invitation aborted'
    return false

  # A user can only send one invitation to a given email
  alreadyInvitedByUser = doc.inviters[inviterId]?
  if alreadyInvitedByUser
    _.warn [ inviterId, doc ], 'alreadyInvitedByUser: invitation aborted'
    return false

  # Admins of a group can send only one invitation to a given email
  if groupId?
    alreadyInvitedInGroup = doc.groups?[groupId]?
    if alreadyInvitedInGroup
      context = [ inviterId, groupId, doc ]
      _.warn context, 'alreadyInvitedInGroup: invitation aborted'
      return false

  return true

module.exports = { create, addInviter, canBeInvited, stopEmails }

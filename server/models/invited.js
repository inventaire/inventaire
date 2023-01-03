import { BasicUpdater } from '#lib/doc_updates'
import { warn } from '#lib/utils/logs'
import validations from '#models/validations/common'

const create = (inviterId, groupId) => email => {
  validations.pass('email', email)
  return addInviter(inviterId, groupId, baseDoc(email))
}

const baseDoc = email => ({
  type: 'invited',
  email,
  inviters: {},
})

const addInviter = (inviterId, groupId, doc) => {
  // The doc shouldn't be updated if the inviter already did invited
  // but in the undesired case it happens, keep the first timestamp
  if (!doc.inviters[inviterId]) doc.inviters[inviterId] = Date.now()
  if (groupId) {
    // doc.inviters and doc.invitersGroups are kept on the user document
    // by User.upgradeInvited, thus the heavy but explicit 'invitersGroups' name
    if (!doc.invitersGroups) doc.invitersGroups = {}
    doc.invitersGroups[groupId] = inviterId
  }
  return doc
}

// The stopEmails flag is added with scripts/lib/stop_emails.js
// to users sending an email at stop-email@inventaire.io
// or reporting inventaire.io emails as spam.
// This could be made more secure and automated
// by sending an unsubscribe link with a token
const stopEmails = BasicUpdater('stopEmails', true)

const canBeInvited = (inviterId, groupId) => doc => {
  if (doc.stopEmails) {
    warn([ inviterId, doc ], 'stopEmails: invitation aborted')
    return false
  }

  // A user can only send one invitation to a given email
  const alreadyInvitedByUser = (doc.inviters[inviterId] != null)
  if (alreadyInvitedByUser) {
    warn([ inviterId, doc ], 'alreadyInvitedByUser: invitation aborted')
    return false
  }

  // Admins of a group can send only one invitation to a given email
  if (groupId) {
    const alreadyInvitedInGroup = doc.groups && doc.groups[groupId] != null
    if (alreadyInvitedInGroup) {
      const context = [ inviterId, groupId, doc ]
      warn(context, 'alreadyInvitedInGroup: invitation aborted')
      return false
    }
  }

  return true
}

export default { create, addInviter, canBeInvited, stopEmails }

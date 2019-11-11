// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const validations = __.require('models', 'validations/common')
const { BasicUpdater } = __.require('lib', 'doc_updates')

const create = (inviterId, groupId) => (function(email) {
  validations.pass('email', email)
  return addInviter(inviterId, groupId, baseDoc(email))
})

var baseDoc = email => ({
  type: 'invited',
  email,
  inviters: {}
})

var addInviter = function(inviterId, groupId, doc){
  // The doc shouldn't be updated if the inviter already did invited
  // but in the undesired case it happens, keep the first timestamp
  if (!doc.inviters[inviterId]) { doc.inviters[inviterId] = Date.now() }
  if (groupId != null) {
    // doc.inviters and doc.invitersGroups are kept on the user document
    // by User.upgradeInvited, thus the heavy but explicit 'invitersGroups' name
    if (!doc.invitersGroups) { doc.invitersGroups = {} }
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

const canBeInvited = (inviterId, groupId) => (function(doc) {
  if (doc.stopEmails) {
    _.warn([ inviterId, doc ], 'stopEmails: invitation aborted')
    return false
  }

  // A user can only send one invitation to a given email
  const alreadyInvitedByUser = (doc.inviters[inviterId] != null)
  if (alreadyInvitedByUser) {
    _.warn([ inviterId, doc ], 'alreadyInvitedByUser: invitation aborted')
    return false
  }

  // Admins of a group can send only one invitation to a given email
  if (groupId != null) {
    const alreadyInvitedInGroup = ((doc.groups != null ? doc.groups[groupId] : undefined) != null)
    if (alreadyInvitedInGroup) {
      const context = [ inviterId, groupId, doc ]
      _.warn(context, 'alreadyInvitedInGroup: invitation aborted')
      return false
    }
  }

  return true
})

module.exports = { create, addInviter, canBeInvited, stopEmails }

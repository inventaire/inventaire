import { convertInvitations, findInvitationByEmail } from '#controllers/invitations/lib/invitations'
import { checkUsernameAvailability } from '#controllers/user/lib/availability'
import { sendValidationEmail } from '#controllers/user/lib/token'
import dbFactory from '#db/couchdb/base'
import { success, Log } from '#lib/utils/logs'
import User from '#models/user'
import preventMultiAccountsCreation from './prevent_multi_accounts_creation.js'

const db = await dbFactory('users')

export default async (username, email, creationStrategy, language, password) => {
  preventMultiAccountsCreation(username)

  return checkUsernameAvailability(username)
  .then(findInvitationByEmail.bind(null, email))
  .then(Log('invitedDoc'))
  .then(invitedDoc => {
    return User.upgradeInvited(invitedDoc, username, creationStrategy, language, password)
    .then(db.putAndReturn)
  })
  .catch(err => {
    if (err.notFound) {
      return User.create(username, email, creationStrategy, language, password)
      .then(db.postAndReturn)
    } else {
      throw err
    }
  })
  .then(postCreation)
}

const postCreation = user => {
  return Promise.all([
    // can be parallelized without risk of conflict as
    // convertInvitations doesnt edit the user document
    // but we do need both to be over to be sure that the user will
    // see the friends requests (converted from invitations)
    convertInvitations(user),
    sendValidationEmail(user),
  ])
  // return the user updated with the validation token
  .then(([ invitationRes, updatedUser ]) => {
    // don't log the user doc to avoid having password hash in logs
    // but still return the doc
    success(updatedUser.username, 'user successfully created')
    return updatedUser
  })
}

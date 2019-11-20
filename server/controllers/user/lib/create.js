const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const preventMultiAccountsCreation = require('./prevent_multi_accounts_creation')
const invitations_ = __.require('controllers', 'invitations/lib/invitations')
const User = __.require('models', 'user')

module.exports = (db, token_, availability_) => {
  const create = (username, email, creationStrategy, language, password) => promises_.try(preventMultiAccountsCreation.bind(null, username))
  .then(() => availability_.username(username))
  .then(invitations_.findOneByEmail.bind(null, email))
  .then(_.Log('invitedDoc'))
  .then(invitedDoc => User.upgradeInvited(invitedDoc, username, creationStrategy, language, password)
  .then(db.putAndReturn)).catch(err => {
    if (err.notFound) {
      return User.create(username, email, creationStrategy, language, password)
      .then(db.postAndReturn)
    } else {
      throw err
    }
  })
  .then(postCreation)

  const postCreation = user => promises_.all([
    // can be parallelized without risk of conflict as
    // convertInvitations doesnt edit the user document
    // but we do need both to be over to be sure that the user will
    // see the friends requests (converted from invitations)
    invitations_.convertInvitations(user),
    token_.sendValidationEmail(user)
  ])
  // return the user updated with the validation token
  .spread((invitationRes, updatedUser) => {
    // don't log the user doc to avoid having password hash in logs
    // but still return the doc
    _.success(updatedUser.username, 'user successfully created')
    return updatedUser
  })

  return create
}

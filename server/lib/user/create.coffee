CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
promises_ = __.require 'lib', 'promises'
preventMultiAccountsCreation = require './prevent_multi_accounts_creation'
invitations_ = __.require 'controllers', 'invitations/lib/invitations'
User = __.require 'models', 'user'

module.exports = (db, token_, availability_)->
  create = (username, email, creationStrategy, language, password)->
    promises_.start
    .then preventMultiAccountsCreation.bind(null, username)
    .then _.Full(availability_.username, availability_, username)
    .then invitations_.findOneByEmail.bind(null, email)
    .then _.Log('invitedDoc')
    .then (invitedDoc)->
      if invitedDoc?
        User.upgradeInvited invitedDoc, username, creationStrategy, language, password
        .then db.putAndReturn
      else
        User.create username, email, creationStrategy, language, password
        .then db.postAndReturn

    .then postCreation

  postCreation = (user)->
    promises_.all [
      # can be parallelized without risk of conflict as
      # convertInvitations doesnt edit the user document
      # but we do need both to be over to be sure that the user will
      # see the friends requests (converted from invitations)
      invitations_.convertInvitations user
      token_.sendValidationEmail user
    ]
    # return the user updated with the validation token
    .spread (invitationRes, updatedUser)->
      # don't log the user doc to avoid having password hash in logs
      # but still return the doc
      _.success updatedUser.username, 'user successfully created'
      return updatedUser

  return create
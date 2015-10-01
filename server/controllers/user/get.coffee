__ = require('config').root
_ = __.require 'builders', 'utils'

User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
transactions_ = __.require 'controllers', 'transactions/lib/transactions'
groups_ = __.require 'controllers', 'groups/lib/groups'
Promise = require 'bluebird'
error_ = __.require 'lib', 'error/error'

module.exports = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  userData = securedData req.user
  userId = userData._id

  getUserData userId
  .spread AttachUserData(userData)
  .then res.json.bind(res)
  .catch error_.Handler(res)

getUserData = (userId)->
  Promise.all([
    user_.getUserRelations(userId)
    user_.getNotifications(userId)
    transactions_.byUser(userId)
    groups_.allUserGroups(userId)
  ])

AttachUserData = (userData)->
  attach = (relations, notifications, transactions, groups)->
    _.extend userData,
      relations: relations
      notifications: notifications
      transactions: transactions
      groups: groups

securedData = (user)-> _.pick user, User.attributes.ownerSafe

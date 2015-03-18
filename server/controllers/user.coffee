__ = require('config').root
_ = __.require 'builders', 'utils'

User = __.require 'models', 'user'
user_ = __.require 'lib', 'user/user'
Promise = require 'bluebird'

module.exports.getUser = (req, res, next) ->
  # implies that req.isAuthenticated() is true
  userData = securedData(req.user)
  userId = userData._id

  Promise.all([
    user_.getUserRelations(userId)
    user_.getNotifications(userId)
  ])
  .spread (relations, notifications)->
    userData.relations = relations
    userData.notifications = notifications
    res.json userData

  .catch (err)->
    _.error err, 'coulnt get user data'
    throw new Error(err)


module.exports.updateUser = (req, res, next) ->
  # implies that req.isAuthenticated() is true

  {attribute, value} = req.body
  {user} = req

  if user[attribute] is value
    return _.errorHandler res, 'already up-to-date', 400

  if attribute in User.attributes.updatable
    unless User.tests[attribute](value)
      return _.errorHandler res, "invalid #{attribute}: #{value}", 400

    return updateAttribute(user, attribute, value)
    .then updateConfirmation.bind(null, res)
    .catch _.errorHandler.bind(_, res)

  if attribute in User.attributes.concurrencial
    return user_.availability[attribute](value)
    .then updateAttribute.bind(null, user, attribute, value)
    .then updateConfirmation.bind(null, res)
    .catch (err)-> _.errorHandler res, err, 400

  _.errorHandler res, "forbidden update: #{attribute} - #{value}", 403



updateAttribute = (user, attribute, value)->
  user_.db.update user._id, (doc)->
    doc[attribute] = value
    return doc

updateConfirmation = (res, doc)->
  _.success doc, 'updateConfirmation'
  res.send('ok')

securedData = (user)-> _.pick user, User.attributes.ownerSafe

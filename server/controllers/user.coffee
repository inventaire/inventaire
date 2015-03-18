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
  current = req.user
  update = req.body

  unless current._id is update._id
    throw new Error "id mismatch: #{current._id} - #{update._id}"

  if _.isEqual(current, update)
    return _.errorHandler res, 'already up-to-date', 400

  user_.db.post(req.body)
  .then (body)-> _.getObjIfSuccess user_.db, body
  .then (body)-> res.json(body)
  .catch (err)-> _.errorHandler res, err


securedData = (user)-> _.pick user, User.attributes.ownerSafe

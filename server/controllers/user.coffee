__ = require('config').root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user'
Promise = require 'bluebird'

module.exports.getUser = (req, res, next) ->
  user_.byEmail(req.session.email)
  .then (docs)->
    if docs?[0]?
      userData = docs[0]
      _.log userData, 'getUser'
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
    else
      _.errorHandler res, 'user not found', 404
  .catch (err)-> _.errorHandler res, err, 404

module.exports.updateUser = (req, res, next) ->
  update = req.body
  user_.byEmail(req.session.email)
  .then (docs)->
    current = docs[0]

    unless current.email is req.session.email
      throw new Error 'invalid email'
    unless current._id is update._id
      throw new Error "id mismatch: #{current._id} - #{update._id}"

    unless _(current).isEqual(update)
      user_.db.post(req.body)
      .then (body)-> _.getObjIfSuccess user_.db, body
      .then (body)-> res.json(body)
      .catch (err)-> _.errorHandler res, err
    else _.errorHandler res, 'already up-to-date', 400
  .catch (err)-> _.errorHandler res, err, 400

__ = require('config').root
_ = __.require 'builders', 'utils'

user_ = __.require 'lib', 'user/user'
notifs_ = __.require 'lib', 'notifications'
Promise = require 'bluebird'

module.exports.updateStatus = (req, res, next) ->
  _.info times = req.body.times, 'times'
  if _.isArray(times) and times.length > 0
    user_.getUserId(req)
    .then (userId)->

      # could probably be replaced by a batch operation
      promises = []
      times.forEach (time)->
        promises.push notifs_.updateReadStatus(userId, time)

      Promise.all(promises)
      .then ->
        _.success [userId, times], 'notifs marked as read'
        res.send('ok')
    .catch (err)-> _.errorHandler res, err
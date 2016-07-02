__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
promises_ = __.require 'lib', 'promises'
user_ = __.require 'lib', 'user/user'
relations_ = __.require 'controllers', 'relations/lib/queries'
comments_ = __.require 'controllers', 'comments/lib/comments'
deleteUserItems = __.require 'controllers', 'items/lib/delete_user_items'
groups_ = __.require 'controllers', 'groups/lib/groups'
notifs_ = __.require 'lib', 'notifications'

module.exports = (req, res)->
  userId = req.user._id

  _.warn req.user, 'deleting user'

  user_.softDeleteById userId
  .then cleanEverything.bind(null, userId)
  .then logout.bind(null, req)
  .then _.OkWarning(res, 'we will miss you :(')
  .catch error_.Handler(req, res)


# what should happen to old:
# commentaries => deleted (the user will expect it to clean her online presence )
# transactions => kept: those are private and remain useful for the other user

cleanEverything = (userId)->
  promises_.all [
    relations_.deleteUserRelations userId
    deleteUserItems userId
    groups_.leaveAllGroups userId
    notifs_.deleteAllByUserId userId
  ]
  .then ->
    # should be run after to avoid conflicts with items comments deletion
    comments_.deleteItemsCommentsByUserId userId

logout = (req)->
  _.warn req.session, 'session before logout'
  req.logout()

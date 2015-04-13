__ = require('config').root
_ = __.require 'builders', 'utils'
user_ = __.require 'lib', 'user/user'
items_ = __.require 'lib', 'items'
comments_ = __.require 'controllers', 'comments/lib/comments'
error_ = __.require 'lib', 'error/error'

module.exports =
  # a user want to post a comment on a given item
  get: (req, res, next)->
    { item } = req.query
    comments_.byItemId(item)
    .then res.json.bind(res)
    .catch error_.Handler(res)

  post: (req, res, next)->
    { itemId, message } = req.body
    userId = req.user._id

    unless itemId? then return error_.bundle res, 'missing item id', 400
    unless message? then return error_.bundle res, 'missing message id', 400


    _.log [itemId, message], 'itemId, message'

    items_.byId itemId
    .then _.partial(comments_.verifyRightToComment, userId)
    .then _.partial(comments_.createComment, userId, message)
    .then _.Ok(res)
    .catch error_.Handler(res)

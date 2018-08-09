__ = require('config').universalPath
_ = __.require 'builders', 'utils'
user_ = __.require 'controllers', 'user/lib/user'
items_ = __.require 'controllers', 'items/lib/items'
comments_ = __.require 'controllers', 'comments/lib/comments'
responses_ = __.require 'lib', 'responses'
sanitize = __.require 'lib', 'sanitize/sanitize'
error_ = __.require 'lib', 'error/error'
{ Track } = __.require 'lib', 'track'

sanitization =
  item: {}

module.exports =
  get: (req, res, next)->
    sanitize req, res, sanitization
    .then (params)->
      { itemId, reqUserId } = params
      items_.byId itemId
      .then comments_.verifyRightToWriteOrReadComment.bind(null, reqUserId)
      .then comments_.byItemId.bind(null, itemId)
    .then responses_.Wrap(res, 'comments')
    .catch error_.Handler(req, res)

  # create
  post: (req, res, next)->
    unless req.user? then return error_.unauthorizedApiAccess req, res
    { item, message } = req.body
    reqUserId = req.user._id

    unless item? then return error_.bundleMissingQuery req, res, 'item'
    unless message? then return error_.bundleMissingQuery req, res, 'message'

    items_.byId item
    .then _.partial(comments_.verifyRightToWriteOrReadComment, reqUserId)
    .then _.partial(comments_.addItemComment, reqUserId, message)
    .then responses_.Send(res)
    .then Track(req, ['item', 'comment'])
    .catch error_.Handler(req, res)

  # update
  put: (req, res, next)->
    unless req.user? then return error_.unauthorizedApiAccess req, res
    { id, message } = req.body
    reqUserId = req.user._id

    unless id? then return error_.bundleMissingQuery req, res, 'id'
    unless message? then return error_.bundleMissingQuery req, res, 'message'

    comments_.byId id
    .then _.partial(comments_.verifyEditRight, reqUserId)
    .then _.partial(comments_.update, message)
    .then responses_.Send(res)
    .catch error_.Handler(req, res)

  delete: (req, res, next)->
    unless req.user? then return error_.unauthorizedApiAccess req, res
    { id } = req.query
    reqUserId = req.user._id

    comments_.byId id
    .then (comment)->
      items_.byId(comment.item)
      .then _.partial(comments_.verifyDeleteRight, reqUserId, comment)
    .then comments_.delete
    .then responses_.Ok(res)
    .catch error_.Handler(req, res)

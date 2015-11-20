CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
comments_ = __.require 'controllers', 'comments/lib/comments'
items_ = __.require 'controllers', 'items/lib/items'
promises_ = __.require 'lib', 'promises'

module.exports = (userId)->
  # get user items ids
  items_.byOwner userId
  .then deleteItemsAndComments.bind(null, userId)

deleteItemsAndComments = (userId, items)->
  promises_.all [
    items_.bulkDelete items
    deleteCommentsByItems userId, items
  ]

deleteCommentsByItems = (userId, items)->
  itemsIds = items.map _.property('_id')
  comments_.deleteByItemsIds itemsIds

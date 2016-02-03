CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
{ getLastItems, formatData, embedUsersData, getHighlightedItems } = require './last_books_helpers'

module.exports = (user, limitDate=0)->
  { _id:userId, position } = user

  unless position? then return formatData [], 'nearby', []

  items_.nearby userId, 20, true
  .then _.Log('items nearby')
  .spread formatItems.bind(null, limitDate, position)

formatItems = (limitDate, position, users, items)->
  lastItems = getLastItems limitDate, items
  highlighted = getHighlightedItems lastItems, 10
  lastItems = embedUsersData lastItems, users, position
  return formatData lastItems, 'nearby', highlighted

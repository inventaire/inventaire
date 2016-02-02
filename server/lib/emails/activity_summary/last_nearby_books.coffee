CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
{ getLastItems, formatData, embedUsersData, getHighlightedItems } = require './last_books_helpers'

module.exports = (user, limitDate=0)->
  { _id:userId, position } = user

  unless position? then return formatData [], 'nearby', []

  items_.nearby userId
  .then _.Log('items nearby')
  .spread formatItems.bind(null, limitDate)

formatItems = (limitDate, users, items)->
  lastItems = getLastItems limitDate, items
  highlighted = getHighlightedItems lastItems, 10
  lastItems = embedUsersData lastItems, users
  return formatData lastItems, 'nearby', highlighted

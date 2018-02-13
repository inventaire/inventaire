CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
items_ = __.require 'controllers', 'items/lib/items'
{ getLastItems, formatData, embedUsersData, getHighlightedItems } = require './last_books_helpers'

module.exports = (user, limitDate=0)->
  { _id:userId, position, lang } = user

  unless position? then return formatData [], 'nearby', lang, []

  items_.nearby userId, 20, true
  .spread formatItems(limitDate, position, lang)

formatItems = (limitDate, position, lang)-> (users, items)->
  items = items.map items_.serializeData
  lastItems = getLastItems limitDate, items
  highlighted = getHighlightedItems lastItems, 10
  lastItems = embedUsersData lastItems, users, position
  return formatData lastItems, 'nearby', lang, highlighted

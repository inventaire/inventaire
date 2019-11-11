CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require('builders', 'utils')
items_ = __.require 'controllers', 'items/lib/items'
User = __.require 'models', 'user'

# Working around the circular dependency
user_ = null
lateRequire = -> user_ = __.require 'controllers', 'user/lib/user'
setTimeout lateRequire, 0

module.exports = (userId)->
  getItemsCounts userId
  .then (itemsCounts)->
    user_.db.update userId, User.updateItemsCounts(itemsCounts)
  .then -> _.info "#{userId} items counts updated"
  .catch _.Error('user updateSnapshotItemsCounts err')

getItemsCounts = (userId)->
  items_.byOwner userId
  .then (items)-> items.reduce aggregateCounts, itemsCountsBase()

aggregateCounts = (index, item)->
  { listing, created } = item
  index[listing]['items:count'] += 1

  lastAdd = index[listing]['items:last-add']
  if not lastAdd? or created > lastAdd
    index[listing]['items:last-add'] = created

  return index

itemsCountsBase = ->
  'private': { 'items:count': 0 }
  'network': { 'items:count': 0 }
  'public': { 'items:count': 0 }

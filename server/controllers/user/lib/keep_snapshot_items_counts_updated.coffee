__ = require('config').universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
User = __.require 'models', 'user'

module.exports = (user_)->
  radio.on 'item:update', (previousItem, updateItem)->
    { owner:userId } = previousItem
    previousListing = previousItem?.listing
    newListing = updateItem?.listing
    # No update needed
    if previousListing is newListing then return
    user_.db.update userId, updateSnapshotItemsCounts(previousListing, newListing)

updateSnapshotItemsCounts = (previousListing, newListing)-> (user)->
  # Item created
  if not previousListing?
    increment user.snapshot[newListing]
  else
    # Item updated
    if newListing? then increment user.snapshot[newListing]
    # Item updated or deleted
    decrement user.snapshot[previousListing]

  return user

increment = (snapshotSection)->
  snapshotSection['items:count'] += 1
  snapshotSection['items:last-add'] = Date.now()
  return

decrement = (snapshotSection)->
  snapshotSection['items:count'] -= 1
  return

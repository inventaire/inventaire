# Keep the user snapshot data about the state of her items updated
# taking care of avoiding edit conflicts on the user document when several items
# are created/edited in a short period of time

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
radio = __.require 'lib', 'radio'
updateSnapshotItemsCounts = require './update_snapshot_items_counts'
{ itemsCountDebounceTime:delay } = CONFIG
totalCount = 0
debounceCount = 0

module.exports = ->
  debouncedUpdaters = {}

  itemsCountsUpdater = (userId)-> ()->
    # When it gets to be called, remove the lazy updater
    # to prevent blocking memory undefinitely
    delete debouncedUpdaters[userId]
    updateSnapshotItemsCounts userId
    .catch _.Error('user updateSnapshotItemsCounts err')

  radio.on 'user:inventory:update', (userId)->
    # Creating a personnalized debouncer as a global debounce would be delayed
    # undefinitely "at scale"
    debouncedUpdaters[userId] or= _.debounce itemsCountsUpdater(userId), delay
    debouncedUpdaters[userId]()

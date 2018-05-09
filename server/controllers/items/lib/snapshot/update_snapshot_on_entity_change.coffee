__ = require('config').universalPath
radio = __.require 'lib', 'radio'
refreshSnapshot = require './refresh_snapshot'

# Items keep some data about their related entities, and those entities graphs
# to make querying items quick, while keeping the required data at end
# to display basic information on the given item.
# This is sort of a caching system, with all the problems related to updating
# cached data.
# The strategy here:
# - update local entities snapshot data directly on change
# - update remote entities snapshot data once in a while:
#   Wikidata's data is assumed to be more reliable, and less changing

# TODO: filter update events by relevance to items snapshots:
# IT doesn't matter that some entity got an update on some properties
# that aren't involved in generating the snapshot data. Ex: edition publisher.

# TODO: use the Wikidata recentchanges API to follow remote entities updates
# https://www.wikidata.org/w/api.php?action=help&modules=query%2Brecentchanges

module.exports = ->
  radio.on 'entity:update:label', refreshSnapshot.fromDoc
  radio.on 'entity:update:claim', refreshSnapshot.fromDoc
  radio.on 'entity:merge', updateSnapshotOnEntityMerge
  # TODO: implement
  # radio.on 'entity:revert:merge', updateSnapshotOnRevertEntityMerge

updateSnapshotOnEntityMerge = (fromUri, toUri)->
  # Using the toUri as its the URI the items are using now
  refreshSnapshot.fromUri toUri

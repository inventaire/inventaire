__ = require('config').universalPath
_ = __.require 'builders', 'utils'
mergeEntities = __.require 'controllers', 'entities/lib/merge_entities'
{ _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
{ prefixifyInv } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (suggestions, authorWorksData)-> (occurrences)->
  unless occurrences.length > 0 then return occurrences
  { labels, authorId } = authorWorksData
  matchedTitles = getMatchedTitles occurrences
  # TODO : check every labels to merge entity
  unless canBeAutomerged suggestions, matchedTitles then return occurrences
  # Assume first occurrence is the right one to merge into
  # since only one suggestion necessary to merge
  # occurrences of first suggestion picked
  mergeEntities reconcilerUserId, prefixifyInv(authorId), occurrences[0].uri
  return []

getMatchedTitles = (occurrences)->
  matchedTitles = occurrences.map (occ)-> _.map(occ.occurrences, 'matchedTitles')
  return _.flattenDeep matchedTitles

canBeAutomerged = (suggestions, matchedTitles)->
  # Several suggestions == has homonym => cannot be merged
  unless suggestions.length is 1 then return false
  longTitles = matchedTitles.filter isLongTitle
  return longTitles.length > 0

isLongTitle = (title)-> title.length > 12

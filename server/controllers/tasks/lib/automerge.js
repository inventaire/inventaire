// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const mergeEntities = __.require('controllers', 'entities/lib/merge_entities')
const { _id: reconcilerUserId } = __.require('couch', 'hard_coded_documents').users.reconciler
const automergeAuthorWorks = require('./automerge_author_works')
const longTitleLimit = 12

// Merge if perfect matched of works title and if title is long enough
module.exports = function(suspectUri, suggestion){
  const { uri:suggestionUri } = suggestion
  if (!isValidateAutomerge(suggestion.occurrences)) {
    return [ suggestion ]
  }

  _.log({ suspectUri, suggestionUri }, 'automerging')

  return mergeEntities(reconcilerUserId, suspectUri, suggestionUri)
  // Give the time to CouchDB to update its views so that the works
  // of the merged author are correctly found
  .delay(100)
  .then(() => automergeAuthorWorks(suggestionUri))
  .then(() => []) // merged suspect
}

var isValidateAutomerge = function(suggestionOccurrences){
  const hasOccurencesInStructuredDataSources =  _.some(_.map(suggestionOccurrences, 'structuredDataSource'))
  if (hasOccurencesInStructuredDataSources) { return true }

  const matchedTitles =  _.flatten(_.map(suggestionOccurrences, 'matchedTitles'))
  const longTitles = matchedTitles.filter(isLongTitle)
  return longTitles.length > 0
}

var isLongTitle = title => title.length > longTitleLimit

const findSourced = suggestions => suggestions.filter(sug => sug.occurrences.length > 0)

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { Wait } = __.require('lib', 'promises')
const mergeEntities = __.require('controllers', 'entities/lib/merge_entities')
const { _id: reconcilerUserId } = __.require('db', 'couchdb/hard_coded_documents').users.reconciler
const automergeAuthorWorks = require('./automerge_author_works')
const longTitleLimit = 12

// Merge if perfect matched of works title and if title is long enough
module.exports = (suspectUri, suggestion) => {
  const { uri: suggestionUri } = suggestion
  if (!isValidateAutomerge(suggestion.occurrences)) {
    return [ suggestion ]
  }

  _.log({ suspectUri, suggestionUri }, 'automerging')

  return mergeEntities({ userId: reconcilerUserId, fromUri: suspectUri, toUri: suggestionUri })
  // Give the time to CouchDB to update its views so that the works
  // of the merged author are correctly found
  .then(Wait(100))
  .then(() => automergeAuthorWorks(suggestionUri))
  .then(() => []) // merged suspect
}

const isValidateAutomerge = suggestionOccurrences => {
  const hasOccurencesInStructuredDataSources = _.some(_.map(suggestionOccurrences, 'structuredDataSource'))
  if (hasOccurencesInStructuredDataSources) return true

  const matchedTitles = _.flatten(_.map(suggestionOccurrences, 'matchedTitles'))
  const longTitles = matchedTitles.filter(isLongTitle)
  return longTitles.length > 0
}

const isLongTitle = title => title.length > longTitleLimit

import _ from '#builders/utils'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { Wait } from '#lib/promises'
import automergeAuthorWorks from './automerge_author_works.js'

const { _id: reconcilerUserId } = hardCodedUsers.reconciler
const longTitleLimit = 12

// Merge if perfect matched of works title and if title is long enough
export const automerge = (suspectUri, suggestion) => {
  const { uri: suggestionUri } = suggestion
  if (!hasConvincingOccurrences(suggestion.occurrences)) {
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

export const hasConvincingOccurrences = suggestionOccurrences => {
  const hasOccurencesInStructuredDataSources = _.some(_.map(suggestionOccurrences, 'structuredDataSource'))
  if (hasOccurencesInStructuredDataSources) return true

  const matchedTitles = _.flatMap(suggestionOccurrences, 'matchedTitles')
  const longTitles = matchedTitles.filter(isLongTitle)
  return longTitles.length > 0
}

const isLongTitle = title => title.length > longTitleLimit

import { flatMap, map, some } from 'lodash-es'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { wait } from '#lib/promises'
import { log } from '#lib/utils/logs'
import automergeAuthorWorks from './automerge_author_works.js'

const { _id: reconcilerUserId } = hardCodedUsers.reconciler
const longTitleLimit = 12

// Merge if perfect matched of works title and if title is long enough
export async function automerge (suspectUri, suggestion) {
  const { uri: suggestionUri } = suggestion
  if (!hasConvincingOccurrences(suggestion.occurrences)) {
    return [ suggestion ]
  }

  log({ suspectUri, suggestionUri }, 'automerging')

  await mergeEntities({ userId: reconcilerUserId, fromUri: suspectUri, toUri: suggestionUri })
  // Give the time to CouchDB to update its views so that the works
  // of the merged author are correctly found
  await wait(100)
  await automergeAuthorWorks(suggestionUri)
  // Suspect merged, no need to re
  return []
}

export const hasConvincingOccurrences = suggestionOccurrences => {
  const hasOccurencesInStructuredDataSources = some(map(suggestionOccurrences, 'structuredDataSource'))
  if (hasOccurencesInStructuredDataSources) return true

  const matchedTitles = flatMap(suggestionOccurrences, 'matchedTitles')
  const longTitles = matchedTitles.filter(isLongTitle)
  return longTitles.length > 0
}

const isLongTitle = title => title.length > longTitleLimit

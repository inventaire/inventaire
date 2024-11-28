import { intersection, property } from 'lodash-es'
import { getAuthorWorks } from '#controllers/entities/lib/get_author_works'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import type { EntityUri, Label } from '#types/entity'
import { getEntityNormalizedTerms } from './terms_normalization.js'

export function getOccurrencesFromEntities (uri: EntityUri, suspectWorksLabels: Label[]) {
  return getAuthorWorks({ uri })
  .then(getSuggestionWorks)
  .then(suggestionWorksData => {
    const occurrences = []
    for (const sugWork of suggestionWorksData) {
      const matchedTitles = filterMatchedTitles(sugWork, suspectWorksLabels)
      if (matchedTitles.length > 0) {
        occurrences.push({
          uri: sugWork.uri,
          matchedTitles,
          structuredDataSource: true,
        })
      }
    }
    return occurrences
  })
}

function filterMatchedTitles (sugWork, suspectWorksLabels) {
  const sugWorkTerms = getEntityNormalizedTerms(sugWork)
  return intersection(suspectWorksLabels, sugWorkTerms)
}

function getSuggestionWorks (res) {
  const uris = res.works.map(property('uri'))
  return getEntitiesList(uris)
}

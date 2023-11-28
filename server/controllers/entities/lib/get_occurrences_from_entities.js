import { intersection, property } from 'lodash-es'
import { getAuthorWorks } from '#controllers/entities/lib/get_author_works'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getEntityNormalizedTerms } from './terms_normalization.js'

export default (uri, suspectWorksLabels) => {
  return getAuthorWorks({ uri })
  .then(getSuggestionWorks)
  .then(suggestionWorksData => {
    const occurrences = []
    for (const sugWork of suggestionWorksData) {
      const sugWorkTerms = getEntityNormalizedTerms(sugWork)
      const matchedTitles = intersection(suspectWorksLabels, sugWorkTerms)
      if (matchedTitles.length > 0) {
        uri = sugWork.uri
        occurrences.push({ uri, matchedTitles, structuredDataSource: true })
      }
    }
    return occurrences
  })
}

const getSuggestionWorks = res => {
  const uris = res.works.map(property('uri'))
  return getEntitiesList(uris)
}

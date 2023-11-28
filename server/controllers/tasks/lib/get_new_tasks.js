import _ from '#builders/utils'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import getOccurrencesFromEntities from '#controllers/entities/lib/get_occurrences_from_entities'
import getOccurrencesFromExternalSources from '#controllers/entities/lib/get_occurrences_from_external_sources'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import { getEntityNormalizedTerms } from '#controllers/entities/lib/terms_normalization'
import typeSearch from '#controllers/search/lib/type_search'
import { automerge } from './automerge.js'

export default async function (entity, existingTasks) {
  const [ newSuggestions, suspectWorksData ] = await Promise.all([
    searchEntityDuplicatesSuggestions(entity, existingTasks),
    getAuthorWorksData(entity._id),
  ])
  if (newSuggestions.length <= 0) return []
  const { labels: worksLabels } = suspectWorksData
  return Promise.all(newSuggestions.map(addOccurrencesToSuggestion(suspectWorksData)))
  .then(filterOrMergeSuggestions(entity, worksLabels))
  .then(filterNewTasks(existingTasks))
}

const filterOrMergeSuggestions = (suspect, workLabels) => suggestions => {
  const suspectTerms = getEntityNormalizedTerms(suspect)
  // Do not automerge if author name is in work title
  // as it confuses occurences found on Wikipedia pages
  if (haveExactMatch(suspectTerms, workLabels)) return suggestions
  const sourcedSuggestions = filterSourced(suggestions)
  if (sourcedSuggestions.length === 0) return suggestions
  if (sourcedSuggestions.length > 1) return sourcedSuggestions
  return automerge(suspect.uri, sourcedSuggestions[0])
}

const filterNewTasks = existingTasks => suggestions => {
  const existingTasksUris = _.map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
}

const filterSourced = suggestions => suggestions.filter(sug => sug.occurrences.length > 0)

const addOccurrencesToSuggestion = suspectWorksData => async suggestion => {
  if (suggestion == null) return []
  const { labels, langs } = suspectWorksData
  const { uri } = suggestion

  if (labels.length === 0) {
    suggestion.occurrences = []
    return suggestion
  }

  return Promise.all([
    getOccurrencesFromExternalSources(uri, labels, langs),
    getOccurrencesFromEntities(uri, labels),
  ])
  .then(([ externalOccurrences, entitiesOccurrences ]) => {
    suggestion.occurrences = externalOccurrences.concat(entitiesOccurrences)
    return suggestion
  })
}

const getAuthorWorksData = async authorId => {
  const works = await getInvEntitiesByClaim('wdt:P50', `inv:${authorId}`, true, true)
  // works = [
  //   { labels: { fr: 'Matiere et Memoire'} },
  //   { labels: { en: 'foo' } }
  // ]
  const labels = _.uniq(works.flatMap(getEntityNormalizedTerms))
  const langs = _.uniq(works.flatMap(getLangs))
  return { authorId, labels, langs }
}

const getLangs = work => Object.keys(work.labels)

const searchEntityDuplicatesSuggestions = async entity => {
  const name = Object.values(entity.labels)[0]
  if (!_.isNonEmptyString(name)) return []

  const { hits } = await typeSearch({
    search: name,
    types: [ 'humans' ],
    filter: 'wd',
    exact: true,
  })

  return hits.map(formatResult)
}

const formatResult = result => ({
  _score: result._score,
  uri: result._source.uri,
})

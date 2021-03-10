const _ = require('builders/utils')
const automerge = require('./automerge')
const typeSearch = require('controllers/search/lib/type_search')
const entities_ = require('controllers/entities/lib/entities')
const getOccurrencesFromEntities = require('controllers/entities/lib/get_occurrences_from_entities')
const getOccurrencesFromExternalSources = require('controllers/entities/lib/get_occurrences_from_external_sources')
const { getEntityNormalizedTerms } = require('controllers/entities/lib/terms_normalization')
const { haveExactMatch } = require('controllers/entities/lib/labels_match')

module.exports = (entity, existingTasks) => {
  return Promise.all([
    searchEntityDuplicatesSuggestions(entity, existingTasks),
    getAuthorWorksData(entity._id)
  ])
  .then(([ newSuggestions, suspectWorksData ]) => {
    if (newSuggestions.length <= 0) return []
    const { labels: worksLabels } = suspectWorksData
    return Promise.all(newSuggestions.map(addOccurrencesToSuggestion(suspectWorksData)))
    .then(filterOrMergeSuggestions(entity, worksLabels))
    .then(filterNewTasks(existingTasks))
  })
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
    getOccurrencesFromEntities(uri, labels)
  ])
  .then(([ externalOccurrences, entitiesOccurrences ]) => {
    suggestion.occurrences = externalOccurrences.concat(entitiesOccurrences)
    return suggestion
  })
}

const getAuthorWorksData = authorId => {
  return entities_.byClaim('wdt:P50', `inv:${authorId}`, true, true)
  .then(works => {
    // works = [
    //   { labels: { fr: 'Matiere et Memoire'} },
    //   { labels: { en: 'foo' } }
    // ]
    const labels = _.uniq(_.flatten(works.map(getEntityNormalizedTerms)))
    const langs = _.uniq(_.flatten(works.map(getLangs)))
    return { authorId, labels, langs }
  })
}

const getLangs = work => Object.keys(work.labels)

const searchEntityDuplicatesSuggestions = async entity => {
  const name = _.values(entity.labels)[0]
  if (!_.isNonEmptyString(name)) return []

  const results = await typeSearch({
    search: name,
    types: [ 'humans' ],
    filter: 'wd',
    exact: true,
  })

  return results.map(formatResult)
}

const formatResult = result => ({
  _score: result._score,
  uri: result._source.uri,
})

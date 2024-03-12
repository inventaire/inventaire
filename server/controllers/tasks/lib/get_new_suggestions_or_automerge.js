import CONFIG from 'config'
import { map, uniq } from 'lodash-es'
import { getInvEntitiesByClaim } from '#controllers/entities/lib/entities'
import { getEntitiesByUris } from '#controllers/entities/lib/get_entities_by_uris'
import getOccurrencesFromEntities from '#controllers/entities/lib/get_occurrences_from_entities'
import { getOccurrencesFromExternalSources } from '#controllers/entities/lib/get_occurrences_from_external_sources'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import { prefixifyInv } from '#controllers/entities/lib/prefix'
import { propertiesValuesConstraints as properties } from '#controllers/entities/lib/properties/properties_values_constraints'
import { getEntityNormalizedTerms } from '#controllers/entities/lib/terms_normalization'
import typeSearch from '#controllers/search/lib/type_search'
import { isNonEmptyString } from '#lib/boolean_validations'
import { forceArray, someMatch } from '#lib/utils/base'
import { automerge, validateAndAutomerge } from './automerge.js'
import { findAuthorWithMatchingIsbnInWikipediaArticles } from './find_authors_with_isbns_in_wikipedia_articles.js'

const { minimumScoreToAutogenerate } = CONFIG.tasks

export default async function (entity, existingTasks) {
  const [ newSuggestionsSearchResults, suspectWorksData ] = await Promise.all([
    searchEntityDuplicatesSuggestions(entity),
    getAuthorWorksData(entity._id),
  ])
  if (newSuggestionsSearchResults.length === 0) return []
  const { labels: worksLabels } = suspectWorksData
  const suggestions = await getAndFormatSuggestionsEntities(newSuggestionsSearchResults)

  // Early merge to avoid triggering external sources requests
  const suggestionWithIsbnInWpArticle = await findAuthorWithMatchingIsbnInWikipediaArticles(suspectWorksData, suggestions)
  if (suggestionWithIsbnInWpArticle) {
    return automerge(entity.uri, suggestionWithIsbnInWpArticle.uri)
  }

  return Promise.all(suggestions.map(addOccurrencesToSuggestion(suspectWorksData)))
  .then(filterOrMergeSuggestions(entity, worksLabels))
  .then(filterGoodEnoughNewSuggestions(existingTasks))
}

async function getAndFormatSuggestionsEntities (newSuggestionsSearchResults) {
  const uris = map(newSuggestionsSearchResults, 'uri')
  const { entities } = await getEntitiesByUris({ uris })
  newSuggestionsSearchResults.forEach(addLexicalScoreToSuggestionsEntities(entities))
  return Object.values(entities)
}

const addLexicalScoreToSuggestionsEntities = entities => suggestionSearchResults => {
  const { uri, _score } = suggestionSearchResults
  const entity = entities[uri]
  // There as been a case during tests where the entity was not found
  // but the reason why could not then be identified.
  // Possibly because of an already merged entity?
  if (entity) entity.lexicalScore = _score
}

const filterOrMergeSuggestions = (suspect, workLabels) => async suggestions => {
  const suspectUri = suspect.uri
  // Merge if entities have a common external identifier
  const suggestionUriCommonExternalId = await findSuggestionWithSameExternalId(suspect, suggestions)
  if (suggestionUriCommonExternalId) return automerge(suspectUri, suggestionUriCommonExternalId.uri)

  const suspectTerms = getEntityNormalizedTerms(suspect)
  // Do not automerge if author name is in work title
  // as it confuses occurences found on Wikipedia pages
  if (haveExactMatch(suspectTerms, workLabels)) return suggestions

  const sourcedSuggestions = filterSourced(suggestions)
  if (sourcedSuggestions.length === 0) return suggestions
  if (sourcedSuggestions.length > 1) return sourcedSuggestions
  return validateAndAutomerge(suspectUri, sourcedSuggestions[0])
}

async function findSuggestionWithSameExternalId (suspect, suggestions) {
  // Known case: inv entity had an externalId before wd item
  // Using typeSearch results allows to only merge homonyms,
  // but could be switched to byClaimValue db request (?)
  const suspectExternalIdsClaims = getExternalIdsClaims(suspect.claims)
  return suggestions.find(suggestion => {
    const suggestionExternalIdsClaims = getExternalIdsClaims(suggestion.claims)
    for (const [ property, values ] of Object.entries(suggestionExternalIdsClaims)) {
      if (someMatch(values, suspectExternalIdsClaims[property])) return true
    }
    return false
  })
}

function getExternalIdsClaims (claims) {
  const externalIdsClaims = {}

  for (const [ property, values ] of Object.entries(claims)) {
    if (properties[property]) {
      const { datatype, format } = properties[property]
      if (datatype === 'external-id') {
        externalIdsClaims[property] = forceArray(values).map(value => {
          if (format) return format(value)
          else return value
        })
      }
    }
  }

  return externalIdsClaims
}

const filterGoodEnoughNewSuggestions = existingTasks => suggestions => {
  const existingTasksSuggestionsUris = map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => {
    if (existingTasksSuggestionsUris.includes(suggestion.uri)) return false
    // Filter only high matching score, which should greatly reduce the amount of tasks created
    if (suggestion.lexicalScore > minimumScoreToAutogenerate) return true
    // Keep suggestions with occurences, which should be worth looking at
    if (suggestion.occurrences.length > 0) return true
    return false
  })
}

const filterSourced = suggestions => suggestions.filter(sug => sug.occurrences.length > 0)

const addOccurrencesToSuggestion = suspectWorksData => async suggestion => {
  if (suggestion == null) return []
  const { labels, langs } = suspectWorksData
  const { uri: suggestionUri } = suggestion

  if (labels.length === 0) {
    suggestion.occurrences = []
    return suggestion
  }

  return Promise.all([
    getOccurrencesFromExternalSources(suggestionUri, labels, langs),
    getOccurrencesFromEntities(suggestionUri, labels),
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
  const labels = uniq(works.flatMap(getEntityNormalizedTerms))
  const langs = uniq(works.flatMap(getLangs))
  const worksUris = works.map(work => prefixifyInv(work._id))
  return { authorId, labels, langs, worksUris }
}

const getLangs = work => Object.keys(work.labels)

const searchEntityDuplicatesSuggestions = async entity => {
  const name = Object.values(entity.labels)[0]
  if (!isNonEmptyString(name)) return []

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

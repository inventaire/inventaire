const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const getWorksFromAuthorsUris = require('./get_works_from_authors_uris')
const typeSearch = __.require('controllers', 'search/lib/type_search')
const parseResults = __.require('controllers', 'search/lib/parse_results')
const { getEntityNormalizedTerms } = require('../terms_normalization')
const getAuthorsUris = require('../get_authors_uris')

// resolve :
// - if seeds terms match entities terms
// - if no other entities are in the search result (only one entity found)

module.exports = entry => {
  const { authors, works } = entry
  if ((authors.length === 0) || (works.length === 0)) return entry

  return Promise.all(authors.map(searchAuthorAndResolve(works)))
  .then(() => entry)
}

const searchAuthorAndResolve = works => author => {
  if ((author == null) || (author.uri != null)) return
  const authorTerms = getEntityNormalizedTerms(author)
  return searchUrisByAuthorTerms(authorTerms)
  .then(resolveWorksAndAuthor(works, author))
}

const searchUrisByAuthorTerms = terms => {
  return Promise.all(terms.map(searchUrisByAuthorLabel))
  .then(_.flatten)
  .then(_.uniq)
}

const types = [ 'humans' ]

const searchUrisByAuthorLabel = term => {
  return typeSearch(types, term)
  .then(parseResults(types))
  // Exact match on normalized author terms
  .filter(hit => getEntityNormalizedTerms(hit._source).includes(term))
  .map(hit => hit._source.uri)
  .then(_.compact)
}

const resolveWorksAndAuthor = (works, author) => authorsUris => {
  return Promise.all(works.map(getWorkAndResolve(author, authorsUris)))
}

const getWorkAndResolve = (authorSeed, authorsUris) => work => {
  if (work == null || work.uri != null) return
  const workTerms = getEntityNormalizedTerms(work)
  return Promise.all(getWorksFromAuthorsUris(authorsUris))
  .then(_.flatten)
  .then(resolveWorkAndAuthor(authorsUris, authorSeed, work, workTerms))
}

const resolveWorkAndAuthor = (authorsUris, authorSeed, workSeed, workTerms) => searchedWorks => {
  // Several searchedWorks could match authors homonyms/duplicates
  if (searchedWorks.length !== 1) return
  const searchedWork = searchedWorks[0]
  const matchedAuthorsUris = _.intersection(getAuthorsUris(searchedWork), authorsUris)
  // If unique author to avoid assigning a work to a duplicated author
  if (matchedAuthorsUris.length !== 1) return
  const searchedWorkTerms = getEntityNormalizedTerms(searchedWork)

  if (!_.someMatch(workTerms, searchedWorkTerms)) return

  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = searchedWork.uri
  return workSeed.uri
}

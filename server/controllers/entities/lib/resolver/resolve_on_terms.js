const _ = require('builders/utils')
const getWorksFromAuthorsUris = require('./get_works_from_authors_uris')
const typeSearch = require('controllers/search/lib/type_search')
const { getEntityNormalizedTerms } = require('../terms_normalization')
const getAuthorsUris = require('../get_authors_uris')

// resolve :
// - if seeds terms match entities terms
// - if no other entity matches those terms

module.exports = async entry => {
  const { authors, works } = entry
  if ((authors.length === 0) || (works.length === 0)) return entry

  await Promise.all(authors.map(searchAuthorAndResolve(works)))
  return entry
}

const searchAuthorAndResolve = works => author => {
  if (author == null || author.uri != null) return
  const authorTerms = getEntityNormalizedTerms(author)
  return searchUrisByAuthorTerms(authorTerms)
  .then(resolveWorksAndAuthor(works, author))
}

const searchUrisByAuthorTerms = terms => {
  return Promise.all(terms.map(searchUrisByAuthorTerm))
  .then(_.flatten)
  .then(_.uniq)
}

const types = [ 'humans' ]

const searchUrisByAuthorTerm = async term => {
  const hits = await typeSearch({ types, search: term, exact: true })
  return hits
  // Exact match on normalized author terms
  .filter(hit => getEntityNormalizedTerms(hit._source).includes(term))
  .map(hit => hit._source.uri)
  .filter(_.identity)
}

const resolveWorksAndAuthor = (works, author) => authorsUris => {
  return Promise.all(works.map(getWorkAndResolve(author, authorsUris)))
}

const getWorkAndResolve = (authorSeed, authorsUris) => async work => {
  if (work == null || work.uri != null) return
  const workTerms = getEntityNormalizedTerms(work)
  const authorsWorks = await getWorksFromAuthorsUris(authorsUris)
  return resolveWorkAndAuthor(authorsUris, authorSeed, work, workTerms, authorsWorks)
}

const resolveWorkAndAuthor = (authorsUris, authorSeed, workSeed, workTerms, authorsWorks) => {
  const matchingSearchedWorks = authorsWorks.filter(isMatchingWork(workTerms))
  // Several authorsWorks could match authors homonyms/duplicates
  if (matchingSearchedWorks.length !== 1) return
  const matchingWork = matchingSearchedWorks[0]
  const matchedAuthorsUris = _.intersection(getAuthorsUris(matchingWork), authorsUris)
  // If unique author to avoid assigning a work to a duplicated author
  if (matchedAuthorsUris.length !== 1) return
  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = matchingWork.uri
  return workSeed.uri
}

const isMatchingWork = workTerms => searchedWork => {
  const searchedWorkTerms = getEntityNormalizedTerms(searchedWork)
  return _.someMatch(workTerms, searchedWorkTerms)
}

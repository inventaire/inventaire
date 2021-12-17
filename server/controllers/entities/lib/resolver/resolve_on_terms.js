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

const searchAuthorAndResolve = works => async author => {
  if (author == null || author.uri != null) return
  const authorTerms = getEntityNormalizedTerms(author)
  const foundAuthorsUris = await searchAuthorsBySeedAuthorTerms(authorTerms)
  await resolveWorksAndAuthor(works, author, foundAuthorsUris)
}

const searchAuthorsBySeedAuthorTerms = terms => {
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

const resolveWorksAndAuthor = async (works, author, foundAuthorsUris) => {
  await Promise.all(works.map(getWorkAndResolve(author, foundAuthorsUris)))
}

const getWorkAndResolve = (authorSeed, foundAuthorsUris) => async work => {
  if (work == null || work.uri != null) return
  const workTerms = getEntityNormalizedTerms(work)
  const foundAuthorsWorks = await getWorksFromAuthorsUris(foundAuthorsUris)
  resolveWorkAndAuthor(foundAuthorsUris, authorSeed, work, workTerms, foundAuthorsWorks)
}

const resolveWorkAndAuthor = (foundAuthorsUris, authorSeed, workSeed, workTerms, foundAuthorsWorks) => {
  const matchingSearchedWorks = foundAuthorsWorks.filter(isMatchingWork(workTerms))
  // Several foundAuthorsWorks could match authors homonyms/duplicates
  if (matchingSearchedWorks.length !== 1) return
  const matchingWork = matchingSearchedWorks[0]
  const matchedAuthorsUris = _.intersection(getAuthorsUris(matchingWork), foundAuthorsUris)
  // If unique author to avoid assigning a work to a duplicated author
  if (matchedAuthorsUris.length !== 1) return
  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = matchingWork.uri
}

const isMatchingWork = workTerms => searchedWork => {
  const searchedWorkTerms = getEntityNormalizedTerms(searchedWork)
  return _.someMatch(workTerms, searchedWorkTerms)
}

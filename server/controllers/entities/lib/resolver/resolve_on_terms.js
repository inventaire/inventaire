// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS104: Avoid inline assignments
 * DS204: Change includes calls to have a more natural evaluation order
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
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

module.exports = function(entry){
  const { authors, works } = entry
  if ((authors.length === 0) || (works.length === 0)) return entry

  return Promise.all(authors.map(searchAuthorAndResolve(works)))
  .then(() => entry)
}

var searchAuthorAndResolve = works => (function(author) {
  if ((author == null) || (author.uri != null)) return 
  const authorTerms = getEntityNormalizedTerms(author)
  return searchUrisByAuthorTerms(authorTerms)
  .then(resolveWorksAndAuthor(works, author))
})

var searchUrisByAuthorTerms = terms => Promise.all(terms.map(searchUrisByAuthorLabel))
.then(_.flatten)
.then(_.uniq)

const types = [ 'humans' ]

var searchUrisByAuthorLabel = term => typeSearch(types, term)
.then(parseResults(types))
// Exact match on normalized author terms
.filter((hit) => { let needle
  return (needle = term, getEntityNormalizedTerms(hit._source).includes(needle)) })
.map(hit => hit._source.uri)
.then(_.compact)

var resolveWorksAndAuthor = (works, author) => authorsUris => Promise.all(works.map(getWorkAndResolve(author, authorsUris)))

var getWorkAndResolve = (authorSeed, authorsUris) => (function(work) {
  if ((work.uri != null) || (work == null)) return 
  const workTerms = getEntityNormalizedTerms(work)
  return Promise.all(getWorksFromAuthorsUris(authorsUris))
  .then(_.flatten)
  .then(resolveWorkAndAuthor(authorsUris, authorSeed, work, workTerms))
})

var resolveWorkAndAuthor = (authorsUris, authorSeed, workSeed, workTerms) => (function(searchedWorks) {
  // Several searchedWorks could match authors homonyms/duplicates
  if (searchedWorks.length !== 1) return 
  const searchedWork = searchedWorks[0]
  const matchedAuthorsUris = _.intersection(getAuthorsUris(searchedWork), authorsUris)
  // If unique author to avoid assigning a work to a duplicated author
  if (matchedAuthorsUris.length !== 1) return 
  const searchedWorkTerms = getEntityNormalizedTerms(searchedWork)

  if (!_.someMatch(workTerms, searchedWorkTerms)) return 

  authorSeed.uri = matchedAuthorsUris[0]
  return workSeed.uri = searchedWork.uri
})

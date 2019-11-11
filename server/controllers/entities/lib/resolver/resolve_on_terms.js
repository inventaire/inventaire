CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getWorksFromAuthorsUris = require './get_works_from_authors_uris'
typeSearch = __.require 'controllers', 'search/lib/type_search'
parseResults = __.require 'controllers', 'search/lib/parse_results'
{ getEntityNormalizedTerms } = require '../terms_normalization'
getAuthorsUris = require '../get_authors_uris'

# resolve :
# - if seeds terms match entities terms
# - if no other entities are in the search result (only one entity found)

module.exports = (entry)->
  { authors, works } = entry
  if authors.length is 0 or works.length is 0 then return entry

  Promise.all authors.map(searchAuthorAndResolve(works))
  .then -> entry

searchAuthorAndResolve = (works)-> (author)->
  if not author? or author.uri? then return
  authorTerms = getEntityNormalizedTerms author
  searchUrisByAuthorTerms authorTerms
  .then resolveWorksAndAuthor(works, author)

searchUrisByAuthorTerms = (terms)->
  Promise.all terms.map(searchUrisByAuthorLabel)
  .then _.flatten
  .then _.uniq

types = [ 'humans' ]

searchUrisByAuthorLabel = (term)->
  typeSearch types, term
  .then parseResults(types)
  # Exact match on normalized author terms
  .filter (hit)-> term in getEntityNormalizedTerms(hit._source)
  .map (hit)-> hit._source.uri
  .then _.compact

resolveWorksAndAuthor = (works, author)-> (authorsUris)->
  Promise.all works.map(getWorkAndResolve(author, authorsUris))

getWorkAndResolve = (authorSeed, authorsUris)-> (work)->
  if work.uri? or not work? then return
  workTerms = getEntityNormalizedTerms work
  Promise.all getWorksFromAuthorsUris(authorsUris)
  .then _.flatten
  .then resolveWorkAndAuthor(authorsUris, authorSeed, work, workTerms)

resolveWorkAndAuthor = (authorsUris, authorSeed, workSeed, workTerms)-> (searchedWorks)->
  # Several searchedWorks could match authors homonyms/duplicates
  unless searchedWorks.length is 1 then return
  searchedWork = searchedWorks[0]
  matchedAuthorsUris = _.intersection getAuthorsUris(searchedWork), authorsUris
  # If unique author to avoid assigning a work to a duplicated author
  unless matchedAuthorsUris.length is 1 then return
  searchedWorkTerms = getEntityNormalizedTerms searchedWork

  unless _.someMatch workTerms, searchedWorkTerms then return

  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = searchedWork.uri

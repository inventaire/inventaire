CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getWorksFromAuthorsUris = require './get_works_from_authors_uris'
typeSearch = __.require 'controllers', 'search/lib/type_search'
parseResults = __.require 'controllers', 'search/lib/parse_results'

# If some works and authors have not been resolved yet,
# resolve if seeds labels match entities labels
# and if no other entities are in the search result (only one entity found)

module.exports = (entry)->
  { authors, works } = entry
  if authors.length is 0 or works.length is 0 then return entry

  Promise.all authors.map(searchAuthorAndResolve(works))
  .then -> entry

searchAuthorAndResolve = (works)-> (author)->
  if not author? or author.uri? then return
  searchUrisByAuthorLabels author.labels
  .then resolveWorksAndAuthor(works, author)

resolveWorksAndAuthor = (works, author)-> (authorsUris)->
  Promise.all works.map(resolveWorkAndAuthor(author, authorsUris))

resolveWorkAndAuthor = (author, authorsUris)-> (work)->
  if work.uri? or not work? then return
  workLabels = _.uniq _.values(work.labels)
  Promise.all getWorksFromAuthorsUris(authorsUris)
  .then _.flatten
  .then getMatchedUris(authorsUris, author, work)

getMatchedUris = (authorsUris, authorSeed, workSeed)-> (searchedWorks)->
  # Several searchedWorks could match authors homonyms/duplicates
  unless searchedWorks.length is 1 then return
  searchedWork = searchedWorks[0]
  matchedAuthorsUris = _.intersection getAuthorsUris(searchedWork), authorsUris
  # If unique author to avoid assigning a work to a duplicated author
  unless matchedAuthorsUris.length is 1 then return
  searchedWorkLabels = getLabels searchedWork.labels
  matchedWorkLabels = _.intersection workLabels, searchedWorkLabels
  if matchedWorkLabels.length is 0 then return

  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = searchedWork.uri

getAuthorsUris = (work)-> work.claims['wdt:P50']

# Check every author labels, in every lang
# TODO: extend search to aliases
searchUrisByAuthorLabels = (labels)->
  labels = _.uniq _.values(labels)
  Promise.all labels.map(searchUrisByAuthorLabel)
  .then _.flatten
  .then _.uniq

types = [ 'humans' ]

searchUrisByAuthorLabel = (label)->
  typeSearch types, label
  .then parseResults(types)
  # Exact match on author labels
  .filter (hit)-> label in _.values(hit._source.labels)
  .map (hit)-> hit._source.uri
  .then _.compact

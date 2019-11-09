CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getWorksFromAuthorsUris = require './get_works_from_authors_uris'
typeSearch = __.require 'controllers', 'search/lib/type_search'
parseResults = __.require 'controllers', 'search/lib/parse_results'

# resolve :
# - if seeds labels match entities labels
# - if no other entities are in the search result (only one entity found)

module.exports = (entry)->
  { authors, works } = entry
  if authors.length is 0 or works.length is 0 then return entry

  Promise.all authors.map(searchAuthorAndResolve(works))
  .then -> entry

searchAuthorAndResolve = (works)-> (author)->
  if not author? or author.uri? then return
  searchUrisByAuthorLabels author.labels
  .then resolveWorksAndAuthor(works, author)

# TODO: extend search to aliases
searchUrisByAuthorLabels = (labels)->
  labels = getLabels labels
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

resolveWorksAndAuthor = (works, author)-> (authorsUris)->
  Promise.all works.map(getWorkAndResolve(author, authorsUris))

getWorkAndResolve = (authorSeed, authorsUris)-> (work)->
  if work.uri? or not work? then return
  workLabels = getLabels work.labels
  Promise.all getWorksFromAuthorsUris(authorsUris)
  .then _.flatten
  .then resolveWorkAndAuthor(authorsUris, authorSeed, work, workLabels)

resolveWorkAndAuthor = (authorsUris, authorSeed, workSeed, workLabels)-> (searchedWorks)->
  lowerSeedLabels = workLabels.map _.toLower
  # Several searchedWorks could match authors homonyms/duplicates
  unless searchedWorks.length is 1 then return
  searchedWork = searchedWorks[0]
  matchedAuthorsUris = _.intersection getAuthorsUris(searchedWork), authorsUris
  # If unique author to avoid assigning a work to a duplicated author
  unless matchedAuthorsUris.length is 1 then return
  searchedWorkLabels = getLabels searchedWork.labels
  lowerSearchedWorkLabels = searchedWorkLabels.map _.toLower
  matchedWorkLabels = _.intersection lowerSeedLabels, lowerSearchedWorkLabels
  if matchedWorkLabels.length is 0 then return

  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = searchedWork.uri

getLabels = (labels)-> _.uniq _.values labels

getAuthorsUris = (work)-> work.claims['wdt:P50']

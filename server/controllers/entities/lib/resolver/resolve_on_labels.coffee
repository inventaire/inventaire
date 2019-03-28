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
  unless _.some(authors) then return entry
  unless _.some(works) then return entry

  Promise.all authors.map (author)->
    if author.uri? or not author? then return
    searchUrisByAuthorLabels _.values(author.labels)
    .then resolveWorksAndAuthor(works, author)
  .then -> entry

resolveWorksAndAuthor = (works, author)-> (authorsUris)->
  Promise.all works.map (work)->
    if work.uri? or not work? then return
    workLabels = _.uniq _.values(work.labels)
    Promise.all getWorksFromAuthorsUris(authorsUris, workLabels)
    .then _.flatten
    .then getMatchedUris(authorsUris, author, work)

getMatchedUris = (authorsUris, authorSeed, workSeed)-> (searchedWorks)->
  # Several searchedWorks could match authors homonyms/duplicates
  unless searchedWorks.length is 1 then return
  work = searchedWorks[0]
  matchedAuthorsUris = _.intersection getAuthorsUris(work), authorsUris
  # If unique author to avoid assigning a work to a duplicated author
  unless matchedAuthorsUris.length is 1 then return

  authorSeed.uri = matchedAuthorsUris[0]
  workSeed.uri = work.uri

getAuthorsUris = (work)-> work.claims['wdt:P50']

searchUrisByAuthorLabels = (labels)->
  # Check every author labels, in every lang
  # TODO: extend search to aliases
  types = [ 'humans' ]
  Promise.all labels.map (label)->
    typeSearch types, label
    .then parseResults(types)
    # Exact match on author labels
    .filter (hit)-> label in _.values(hit._source.labels)
    .map (hit)-> hit._source.uri
    .then _.compact
  .then _.flatten
  .then _.uniq

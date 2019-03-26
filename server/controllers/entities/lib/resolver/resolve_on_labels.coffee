CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getWorksFromAuthorsUris = require './get_works_from_authors_uris'
typeSearch = __.require 'controllers', 'search/lib/type_search'
parseResults = __.require 'controllers', 'search/lib/parse_results'

module.exports = (works, authors)->
  worksSeeds = _.reject works, 'uri'
  authorSeeds = _.reject authors, 'uri'
  if _.isEmpty(worksSeeds) or _.isEmpty(authorSeeds) then return

  Promise.all authorSeeds.map (authorSeed)->
    searchByAuthorLabels _.values(authorSeed.labels)
    .then resolveWorksAndAuthors(worksSeeds, authorSeed)

resolveWorksAndAuthors = (worksSeeds, authorSeed)-> (authorsUris)->
  Promise.all worksSeeds.map (workSeed)->
    workSeedLabels = _.uniq _.values(workSeed.labels)
    Promise.all getWorksFromAuthorsUris(authorsUris, workSeedLabels)
    .then _.flatten
    .then getMatchedUris(authorsUris)
    .then resolveWorkAndAuthor(authorSeed, workSeed)

getMatchedUris = (authorsUris)-> (works)->
  # Several works could match authors homonyms/duplicates
  if works.length is 1
    work = works[0]
    workAuthorsUris = work.claims['wdt:P50']
    authorsUris = _.intersection workAuthorsUris, authorsUris
    # Resolve work AND author to avoid assigning a work to a duplicated author
    if authorsUris.length is 1
      authorUri = authorsUris[0]
      workUri = work.uri
      { authorUri, workUri }

resolveWorkAndAuthor = (author, work)-> (res)->
  unless res then return
  { authorUri, workUri } = res
  author.uri = authorUri
  work.uri = workUri

searchByAuthorLabels = (labels)->
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

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
getWorksFromAuthorsLabels = require './get_works_from_authors_uris'

# Resolve a work(or author) seed when the author(or work) seed is already resolved

module.exports = (entry)->
  { authors, works } = entry
  unless _.some(works) then return entry

  worksUris = getAlreadyResolvedUris works
  worksAuthorsUris = _.compact _.flatten(works.map(getAuthorsUris))
  authorsUris = _.uniq getAlreadyResolvedUris(authors).concat(worksAuthorsUris)

  Promise.all authors.map(resolveAuthor(worksUris))
  .then (authors)-> entry.authors = authors
  .then -> Promise.all works.map(resolveWork(authorsUris))
  .then (works)-> entry.works = works
  .then -> entry

getAuthorsUris = (work)-> work.claims['wdt:P50']

getAlreadyResolvedUris = (seed)-> _.compact _.map(seed, 'uri')

resolveAuthor = (worksUris)-> (author)->
  if author.uri? or _.isEmpty(worksUris) then return author
  authorSeedLabels = getLabels author
  getAuthorsFromWorksUris worksUris
  .filter ifSomeLabelsMatch(authorSeedLabels)
  .then resolveSeed(author)

resolveWork = (authorsUris)-> (work)->
  if work.uri? or _.isEmpty(authorsUris) then return work
  workSeedLabels = getLabels work
  Promise.all getWorksFromAuthorsLabels(authorsUris)
  .filter ifSomeLabelsMatch(workSeedLabels)
  .then resolveSeed(work)

ifSomeLabelsMatch = (seedLabels)-> (entity)->
  entitiesLabels = _.values entity.labels
  _.intersection(seedLabels, entitiesLabels).length > 0

getLabels = (seed)-> _.values seed.labels

resolveSeed = (seed)-> (entities)->
  # When only one entity is found, then seed is considered resolved
  if entities.length is 1 then seed.uri = entities[0].uri
  return seed

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
getWorksFromAuthorsLabels = require './get_works_from_authors_uris'

module.exports = (authorSeeds, workSeeds)->
  # If one of the seeds group is empty, no resolve can be done
  unless _.some(authorSeeds) and _.some(workSeeds) then return
  worksUris = getAlreadyResolvedUris workSeeds
  authorsUris = getAlreadyResolvedUris authorSeeds

  Promise.all authorSeeds.map(resolveAuthors(worksUris))
  .then -> Promise.all workSeeds.map(resolveWorks(authorsUris))

getAlreadyResolvedUris = (seed)-> _.compact _.map(seed, 'uri')

resolveAuthors = (worksUris)-> (author)->
  getWorksFromAuthorsLabels worksUris, getLabels(author)
  .then setSeedUri(author)

resolveWorks = (authorsUris)-> (work)->
  getAuthorsFromWorksUris authorsUris, getLabels(work)
  .then setSeedUri(work)

getLabels = (seed)-> _.values seed.labels

setSeedUri = (seed)-> (entities)->
  # When only one entity is found, then seed is considered resolved
  if entities.length is 1 then seed.uri = entities[0].uri

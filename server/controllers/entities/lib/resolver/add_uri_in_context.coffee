CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
matchWorksFromAuthorsLabels = require './get_works_from_authors_uris'

module.exports = (authors, works)->
  # if one of the seeds group is empty, no resolve can be done
  unless _.some(authors) and _.some(works) then return
  # Return if author is already resolved
  worksUris = getAlreadyResolvedUris works
  authorsUris = getAlreadyResolvedUris authors

  Promise.all authors.map(resolveAuthors(worksUris))
  .then -> Promise.all works.map(resolveWorks(authorsUris))

getAlreadyResolvedUris = (seed)-> _.compact _.map(seed, 'uri')

resolveAuthors = (worksUris)-> (author)->
  matchWorksFromAuthorsLabels worksUris, getLabels(author)
  .then setUriToEntry(author)

resolveWorks = (authorsUris)-> (work)->
  getAuthorsFromWorksUris authorsUris, getLabels(work)
  .then setUriToEntry(work)

getLabels = (entity)-> _.values entity.labels

setUriToEntry = (entry)-> (entities)->
  # Only one author found, then it must match entry author
  if entities.length is 1 then entry.uri = entities[0].uri


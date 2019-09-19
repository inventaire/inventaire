CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
{ getAlreadyResolvedUris, ifSomeLabelsMatch, getLabels, resolveSeed } = require './helpers'

module.exports = (authors, works)->
  worksUris = getAlreadyResolvedUris works
  Promise.all authors.map(resolveAuthor(worksUris))

resolveAuthor = (worksUris)-> (author)->
  if author.uri? or _.isEmpty(worksUris) then return author
  authorSeedLabels = getLabels author
  getAuthorsFromWorksUris worksUris
  .filter ifSomeLabelsMatch(authorSeedLabels)
  .then resolveSeed(author)

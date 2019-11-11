CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
getAuthorsFromWorksUris = require './get_authors_from_works_uris'
{ getAlreadyResolvedUris, someTermsMatch, resolveSeed } = require './helpers'
{ getEntityNormalizedTerms } = require '../terms_normalization'

module.exports = (authors, works)->
  worksUris = getAlreadyResolvedUris works
  if worksUris.length is 0 then return Promise.resolve authors
  Promise.all authors.map(resolveAuthor(worksUris))

resolveAuthor = (worksUris)-> (author)->
  if author.uri? then return author
  authorSeedTerms = getEntityNormalizedTerms author
  getAuthorsFromWorksUris worksUris
  .filter someTermsMatch(authorSeedTerms)
  .then resolveSeed(author)

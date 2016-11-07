__ = require('config').universalPath
{ normalizeIsbn } = __.require 'lib', 'isbn/isbn'

module.exports = (entity)->
  wdId = entity.claims['invp:P1']?[0]
  isbn = entity.claims['wdt:P212']?[0]

  invUri = "inv:#{entity._id}"

  # Those URIs are aliases but, when available, always use the Wikidata id
  # or the ISBN
  if wdId? then uri = "wd:#{wdId}"
  # By internal convention, ISBN URIs are without hyphen
  else if isbn? then uri = "isbn:#{normalizeIsbn(isbn)}"
  else uri = invUri

  redirects = null
  if uri isnt invUri
    redirects =
      from: invUri
      to: entity.uri

  return [ uri, redirects ]

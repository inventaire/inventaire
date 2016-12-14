__ = require('config').universalPath
{ normalizeIsbn } = __.require 'lib', 'isbn/isbn'

module.exports = (entity)->
  { _id:invId, redirect } = entity
  invUri = "inv:#{entity._id}"

  # Case when the entity document is simply a redirection to another entity
  # signaled via the 'redirect' attribute on the entity document
  if redirect?
    redirectsObj =
      from: invUri
      to: redirect
    return [ redirect, redirectsObj ]

  # Case when the entity document is a proper entity document
  # but as a more broadly recognized URI available: ISBN or Wikidata id
  wdId = entity.claims['invp:P1']?[0]
  isbn = entity.claims['wdt:P212']?[0]

  # Those URIs are aliases but, when available, always use the Wikidata id
  # or the ISBN
  if wdId? then uri = "wd:#{wdId}"
  # By internal convention, ISBN URIs are without hyphen
  else if isbn? then uri = "isbn:#{normalizeIsbn(isbn)}"
  else uri = invUri

  redirectsObj = null
  if uri isnt invUri
    redirectsObj =
      from: invUri
      to: uri

  return [ uri, redirectsObj ]

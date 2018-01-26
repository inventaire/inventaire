__ = require('config').universalPath
{ normalizeIsbn } = __.require 'lib', 'isbn/isbn'

module.exports = (entity)->
  { _id:invId, redirect } = entity
  invUri = "inv:#{entity._id}"

  # Case when the entity document is simply a redirection to another entity
  # signaled via the 'redirect' attribute on the entity document
  if redirect?
    redirectsObj =
      from: invUri
      to: redirect
    return [ redirect, redirectsObj ]

  # Case when the entity document is a proper entity document
  # but has a more broadly recognized URI available, currently only an ISBN
  isbn = entity.claims['wdt:P212']?[0]

  # Those URIs are aliases but, when available, always use the canonical id,
  # that is, in the only current, the ISBN
  # By internal convention, ISBN URIs are without hyphen
  if isbn? then uri = "isbn:#{normalizeIsbn(isbn)}"
  else uri = invUri

  redirectsObj = null
  if uri isnt invUri
    redirectsObj =
      from: invUri
      to: uri

  return [ uri, redirectsObj ]

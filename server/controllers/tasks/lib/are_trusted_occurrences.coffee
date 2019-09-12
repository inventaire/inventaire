__ = require('config').universalPath
_ = __.require 'builders', 'utils'

trustworthyDomains = [
  'data.bnf.fr',
  'bnb.data.bl.uk',
  'datos.bne.es',
  'libris.kb.se',
  'data.bibliotheken.nl',
  'jpsearch.go.jp',
  'openlibrary.org'
]

module.exports = (occurrences)->
  unless _.some(occurrences) then return false
  trustedOccurrences = _.filter occurrences, isTrustedOccurrence
  trustedOccurrences.length > 1

isTrustedOccurrence = (occurrence)->
  unless occurrence.matchedTitles and occurrence.url then return false
  domain = getDomainName occurrence.url
  return domain in trustworthyDomains

getDomainName = (url)-> url.split('/')[2]

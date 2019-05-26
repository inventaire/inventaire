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
  trustedOccurences = _.filter occurrences, isTrustedOccurence
  trustedOccurences.length > 1

isTrustedOccurence = (occurence)->
  unless occurence.matchedTitles? then return false
  domain = getDomainName occurence.url
  return domain in trustworthyDomains

getDomainName = (url)-> url.split('/')[2]

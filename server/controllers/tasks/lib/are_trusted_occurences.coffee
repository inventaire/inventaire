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

module.exports = (occurences)->
  _.inspect occurences,"##### 1a ##"
  unless _.some occurrences then return false
  _.inspect occurences,"##### 15 ##"
  result = occurences.map (occurence)->
    unless occurence.matchedTitles? then return false
    domain = getDomainName occurence.url
    _.includes(trustworthyDomains, domain)
  .filter (bool)-> bool is true

  result.length > 0

getDomainName = (url)->
  _.split(url, '/')[2]
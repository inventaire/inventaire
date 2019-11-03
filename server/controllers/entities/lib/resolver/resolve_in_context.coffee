CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
resolveWorksFromEdition = require './resolve_works_from_edition'
resolveAuthorsFromWorks = require './resolve_authors_from_works'
resolveWorksFromAuthors = require './resolve_works_from_authors'

# Resolve a work(or author) seed when the author(or work) seed is already resolved

module.exports = (entry)->
  { authors, works, edition } = entry

  unless _.some(works) then return entry

  resolveWorksFromEdition works, edition
  .then (works)->
    entry.works = works
    resolveAuthorsFromWorks authors, works
    .then (authors)-> entry.authors = authors
    .then -> resolveWorksFromAuthors works, authors
  .then (works)-> entry.works = works
  .then -> entry

hasAuthorClaims = (work)-> work.claims['wdt:P50']?

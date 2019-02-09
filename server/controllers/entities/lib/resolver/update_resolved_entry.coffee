CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'

module.exports = (options, userId)-> (entry)->
  { edition, works, authors } = entry
  unless _.includes(options, 'update') then return entry

  updateAuthors authors, userId
  .then -> updateWorks(works, userId)
  .then -> updateEdition(edition, userId)
  .then -> entry

updateAuthors = (authors, userId)->
  resolvedAuthors = _.filter authors, 'uri'
  Promise.all resolvedAuthors.map (author)->
    updateEntityFromEntry(author, userId)

updateWorks = (works, userId)->
  resolvedWorks = _.filter works, 'uri'
  Promise.all resolvedWorks.map (work)->
    updateEntityFromEntry(work, userId)

updateEdition = (edition, userId)->
  Promise.all edition.map (edition)->
    updateEntityFromEntry(edition, userId)

updateEntityFromEntry = (entry, userId)->
  { uri, claims:entryClaims } = entry
  unless uri then return
  [ prefix, entityId ] = uri.split ':'
  # Skip wd uris, to update only inventaire entities for the moment
  if prefix is 'wd' then return

  if prefix is 'isbn'
    return entities_.byIsbn entityId
    .then updateClaims(entry, userId)
  entities_.byId entityId
  .then updateClaims(entry, userId)

updateClaims = (entry, userId)-> (currentDoc)->
  currentProps = Object.keys currentDoc.claims
  newClaims = { }

  _.mapKeys entry.claims, (entryValues, entryProp)->
    unless entryProp in currentProps
      _.assign newClaims, { "#{entryProp}": entryValues }

  if _.isEmpty(newClaims) then return

  entities_.addClaims userId, newClaims, currentDoc


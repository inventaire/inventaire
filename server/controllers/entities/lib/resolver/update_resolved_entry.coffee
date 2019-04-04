CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'

module.exports = (userId, batchId)-> (entry)->
  { edition, works, authors } = entry

  updateAuthors authors, userId, batchId
  .then -> updateWorks works, userId, batchId
  .then -> updateEntityFromEntry edition, userId, batchId
  .then -> entry

updateAuthors = (authors, userId, batchId)->
  resolvedAuthors = _.filter authors, 'uri'
  Promise.all resolvedAuthors.map (author)->
    updateEntityFromEntry(author, userId, batchId)

updateWorks = (works, userId, batchId)->
  resolvedWorks = _.filter works, 'uri'
  Promise.all resolvedWorks.map (work)->
    updateEntityFromEntry(work, userId, batchId)

updateEntityFromEntry = (entry, userId, batchId)->
  { uri, claims:entryClaims } = entry
  unless uri then return
  [ prefix, entityId ] = uri.split ':'
  # Skip wd uris, to update only inventaire entities for the moment
  if prefix is 'wd' then return

  if prefix is 'isbn'
    entities_.byIsbn entityId
    .then updateClaims(entry, userId, batchId)
  else
    entities_.byId entityId
    .then updateClaims(entry, userId, batchId)

updateClaims = (entry, userId, batchId)-> (currentDoc)->
  currentProps = Object.keys currentDoc.claims
  newClaims = {}

  _.mapKeys entry.claims, (entryValues, entryProp)->
    unless entryProp in currentProps
      newClaims[entryProp] = entryValues

  if _.isEmpty(newClaims) then return

  entities_.addClaims userId, newClaims, currentDoc, batchId

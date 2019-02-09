CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
{ Promise } = __.require 'lib', 'promises'
entities_ = require '../entities'
getEntityByUri = require '../get_entity_by_uri'
retryOnConflict = __.require 'lib', 'retry_on_conflict'
{ unprefixify } = __.require 'controllers', 'entities/lib/prefix'

module.exports = (options, userId)-> (entry)->
  { edition, works, authors } = entry
  unless _.includes(options, 'update') then return entry

  # rewrite user for claims update,
  # disable admin to forbid update of important claims
  user =
    _id: userId
    admin: false

  updateAuthors authors, user
  .then -> updateWorks(works, user)
  .then -> entry

updateAuthors = (authors, user)->
  resolvedAuthors = _.filter authors, 'uri'

  Promise.all resolvedAuthors.map (author)->
    updateEntityFromEntry(author, user)

updateWorks = (works, user)->
  resolvedWorks = _.filter works, 'uri'
  Promise.all resolvedWorks.map (work)->
    updateEntityFromEntry(work, user)

updateEntityFromEntry = (entry, user)->
  { uri, claims:entryClaims } = entry
  unless uri then return
  [ prefix, entityId ] = uri.split ':'
  # Skip wd uris, to update only inventaire entities for the moment
  unless prefix is 'inv' then return

  getEntityByUri { uri }
  .then (currentDoc)->
    newClaims = getClaimsToUpdate(entry, currentDoc)
    entities_.addClaims user._id, newClaims, currentDoc

getClaimsToUpdate = (entry, currentDoc)->
  newClaims = { }
  _.mapKeys entry.claims, (entryValues, entryProp)->
    for currentProp in Object.keys(currentDoc.claims)
      assignNewClaim newClaims, currentDoc, currentProp, entryValues, entryProp
  newClaims

assignNewClaim = (newClaims, currentDoc, currentProp, entryValues, entryProp)->
  unless entryProp in Object.keys(currentDoc.claims)
    _.assign newClaims, { "#{entryProp}": entryValues }

  if entryProp is currentProp
    currentValues = currentDoc.claims[currentProp]
    # update only values different from existing values
    newValues = _.difference entryValues, currentValues
    if _.some newValues
      _.merge newClaims, { "#{entryProp}": newValues }

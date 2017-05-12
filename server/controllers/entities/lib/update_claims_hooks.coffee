# Use hooks to infer entity updates from other entity updates
# Ex: update the label of a work when one of its

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
error_ = __.require 'lib', 'error/error'
radio = __.require 'lib', 'radio'
entities_ = require './entities'
getEntityType = require './get_entity_type'
{ getOriginalLang } = __.require 'lib', 'wikidata/wikidata'
{ _id:hookUserId } = __.require('couch', 'hard_coded_documents').users.hook
updateLabel = require './update_label'

module.exports = -> radio.on 'entity:update:claim', claimUpdateHooks

claimUpdateHooks = (updatedDoc, property, oldVal, newVal)->
  type = getEntityType updatedDoc.claims['wdt:P31']
  if type is 'edition' and property is 'wdt:P1476'
    keepWorkLabelAndEditionTitleInSync updatedDoc, oldVal, newVal

keepWorkLabelAndEditionTitleInSync = (edition, oldTitle, newTitle)->
  workUri = edition.claims['wdt:P629'][0]
  editionLang = getOriginalLang edition.claims
  [ prefix, id ] = workUri.split ':'
  # local work entity all have an 'inv' prefix
  unless prefix is 'inv' then return

  entities_.byId id
  .then (workDoc)->
    # TODO: check the opinion from other editions of this lang
    currentEditionLangLabel = workDoc.labels[editionLang]
    workLabelAndEditionTitleSynced = oldTitle is currentEditionLangLabel
    noWorkLabel = not currentEditionLangLabel?
    if noWorkLabel or workLabelAndEditionTitleSynced
      _.info [ workDoc._id, editionLang, newTitle ], 'hook update'
      updateLabel editionLang, newTitle, hookUserId, workDoc
  .catch _.Error('hook update err')

__ = require('config').universalPath
_ = __.require 'builders', 'utils'
entities_ = require './entities'
getOriginalLang = __.require 'lib', 'wikidata/get_original_lang'
{ _id:hookUserId } = __.require('couch', 'hard_coded_documents').users.hook
updateLabel = require './update_label'

module.exports = (edition, oldTitle)->
  workUris = edition.claims['wdt:P629']
  # Ignore composite editions
  if workUris.length isnt 1 then return
  workUri = workUris[0]
  editionLang = getOriginalLang edition.claims

  unless editionLang?
    _.warn edition._id, "couldn't apply hook: edition miss a lang"
    return

  [ prefix, id ] = workUri.split ':'
  # local work entity all have an 'inv' prefix
  unless prefix is 'inv' then return

  # Check the opinion from other editions of this lang
  fetchLangConsensusTitle workUri, editionLang
  .then (consensusEditionTitle)->
    unless _.isNonEmptyString consensusEditionTitle then return
    entities_.byId id
    .then updateWorkLabel(editionLang, oldTitle, consensusEditionTitle)
  .catch _.Error('hook update err')

fetchLangConsensusTitle = (workUri, editionLang)->
  entities_.byClaim 'wdt:P629', workUri, true, true
  .filter (edition)-> getOriginalLang(edition.claims) is editionLang
  .map (edition)-> edition.claims['wdt:P1476'][0]
  .then (titles)->
    differentTitles = _.uniq titles
    if differentTitles.length is 1 then return differentTitles[0]
    else return null

updateWorkLabel = (editionLang, oldTitle, consensusEditionTitle)-> (workDoc)->
  currentEditionLangLabel = workDoc.labels[editionLang]
  workLabelAndEditionTitleSynced = oldTitle is currentEditionLangLabel
  noWorkLabel = not currentEditionLangLabel?
  if noWorkLabel or workLabelAndEditionTitleSynced
    _.info [ workDoc._id, editionLang, consensusEditionTitle ], 'hook update'
    updateLabel editionLang, consensusEditionTitle, hookUserId, workDoc

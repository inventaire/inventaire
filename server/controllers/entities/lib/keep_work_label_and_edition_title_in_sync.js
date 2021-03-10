const _ = require('builders/utils')
const entities_ = require('./entities')
const getOriginalLang = require('lib/wikidata/get_original_lang')
const { _id: hookUserId } = require('db/couchdb/hard_coded_documents').users.hook
const updateLabel = require('./update_label')

// TODO: also check for edition subtitle

module.exports = (edition, oldTitle) => {
  const workUris = edition.claims['wdt:P629']
  // Ignore composite editions
  if (workUris.length !== 1) return
  const workUri = workUris[0]
  const editionLang = getOriginalLang(edition.claims)

  if (editionLang == null) {
    _.warn(edition._id, "couldn't apply hook: edition miss a lang")
    return
  }

  const [ prefix, id ] = workUri.split(':')
  // local work entity all have an 'inv' prefix
  if (prefix !== 'inv') return

  // Check the opinion from other editions of this lang
  return fetchLangConsensusTitle(workUri, editionLang)
  .then(consensusEditionTitle => {
    if (!_.isNonEmptyString(consensusEditionTitle)) return
    return entities_.byId(id)
    .then(updateWorkLabel(editionLang, oldTitle, consensusEditionTitle))
  })
  .catch(_.Error('hook update err'))
}

const fetchLangConsensusTitle = async (workUri, editionLang) => {
  const editions = await entities_.byClaim('wdt:P629', workUri, true, true)

  const titles = editions
    .filter(edition => getOriginalLang(edition.claims) === editionLang)
    .map(edition => edition.claims['wdt:P1476'][0])

  const differentTitles = _.uniq(titles)
  if (differentTitles.length === 1) {
    return differentTitles[0]
  } else {
    return null
  }
}

const updateWorkLabel = (editionLang, oldTitle, consensusEditionTitle) => workDoc => {
  const currentEditionLangLabel = workDoc.labels[editionLang]
  const workLabelAndEditionTitleSynced = oldTitle === currentEditionLangLabel
  const noWorkLabel = (currentEditionLangLabel == null)
  if (noWorkLabel || workLabelAndEditionTitleSynced) {
    _.info([ workDoc._id, editionLang, consensusEditionTitle ], 'hook update')
    return updateLabel(editionLang, consensusEditionTitle, hookUserId, workDoc)
  }
}

import { uniq } from 'lodash-es'
import { getInvEntitiesByClaim, getEntityById } from '#controllers/entities/lib/entities'
import { hardCodedUsers } from '#db/couchdb/hard_coded_documents'
import { isNonEmptyString } from '#lib/boolean_validations'
import { warn, info, LogError } from '#lib/utils/logs'
import getOriginalLang from '#lib/wikidata/get_original_lang'
import updateLabel from './update_label.js'

const { _id: hookUserId } = hardCodedUsers.hook

// TODO: also check for edition subtitle

export default (edition, oldTitle) => {
  const workUris = edition.claims['wdt:P629']
  // Ignore composite editions
  if (workUris.length !== 1) return
  const workUri = workUris[0]
  const editionLang = getOriginalLang(edition.claims)

  if (editionLang == null) {
    warn(edition._id, "couldn't apply hook: edition miss a lang")
    return
  }

  const [ prefix, id ] = workUri.split(':')
  // local work entity all have an 'inv' prefix
  if (prefix !== 'inv') return

  // Check the opinion from other editions of this lang
  return fetchLangConsensusTitle(workUri, editionLang)
  .then(consensusEditionTitle => {
    if (!isNonEmptyString(consensusEditionTitle)) return
    return getEntityById(id)
    .then(updateWorkLabel(editionLang, oldTitle, consensusEditionTitle))
  })
  .catch(LogError('hook update err'))
}

const fetchLangConsensusTitle = async (workUri, editionLang) => {
  const editions = await getInvEntitiesByClaim('wdt:P629', workUri, true, true)

  const titles = editions
    .filter(edition => getOriginalLang(edition.claims) === editionLang)
    .map(edition => edition.claims['wdt:P1476'][0])

  const differentTitles = uniq(titles)
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
    info([ workDoc._id, editionLang, consensusEditionTitle ], 'hook update')
    return updateLabel(editionLang, consensusEditionTitle, hookUserId, workDoc)
  }
}

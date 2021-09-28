const CONFIG = require('config')
const getEntitiesList = require('controllers/entities/lib/get_entities_list')
const { prefixifyInv } = require('controllers/entities/lib/prefix')
const { i18n } = require('lib/emails/i18n/i18n')
const getBestLangValue = require('lib/get_best_lang_value')
const { makeUrl, getEntityActorName, getActivityIdFromPatchId } = require('./helpers')
const host = CONFIG.fullPublicHost()

module.exports = rows => {
  rows = rows.filter(hasActivityText)
  return Promise.all(rows.map(formatEntityPatchActivity))
}

const activityText = {
  'wdt:P50': 'author_has_new_work',
  'wdt:P123': 'publisher_has_new_edition',
  'wdt:P195': 'collection_has_new_edition',
  'wdt:P921': 'subject_has_new_work',
}

const hasActivityText = ({ value: property }) => activityText[property] != null

const formatEntityPatchActivity = async (row, rowIndex) => {
  const { id: patchId, key, value: property } = row
  const [ objectUri, timestamp ] = key
  const subjectUri = prefixifyInv(patchId.split(':')[0])
  const [ subjectEntity, objectEntity ] = await getEntitiesList([ subjectUri, objectUri ])
  const subjectLabel = getBestLangValue('en', subjectEntity.originalLang, subjectEntity.labels).value
  const objectLabel = getBestLangValue('en', objectEntity.originalLang, objectEntity.labels).value
  const activityId = getActivityIdFromPatchId(patchId, rowIndex)
  const id = `${host}/api/activitypub?action=activity&id=${activityId}`
  const name = getEntityActorName(objectUri)
  const actor = makeUrl({ params: { action: 'actor', name } })
  const subjectUrl = `${host}/entity/${subjectUri}`
  const objectUrl = `${host}/entity/${objectUri}`

  const object = {
    id,
    type: 'Note',
    content: `<p>${i18n('en', activityText[property], { subjectLabel, subjectUrl, objectLabel, objectUrl })}</p>`,
    published: new Date(timestamp).toISOString(),
  }

  return {
    id: `${id}#create`,
    '@context': 'https://www.w3.org/ns/activitystreams',
    type: 'Create',
    object,
    actor,
    to: 'Public',
  }
}

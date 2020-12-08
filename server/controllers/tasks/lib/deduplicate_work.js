const CONFIG = require('config')
const __ = CONFIG.universalPath
let error_ = __.require('lib', 'error/error')
const getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')
const tasks_ = require('./tasks')
error_ = __.require('lib', 'error/error')
const getEntitiesByIsbns = __.require('controllers', 'entities/lib/get_entities_by_isbns')
const mergeEntities = __.require('controllers', 'entities/lib/merge_entities')

module.exports = async (workUri, isbn, userId) => {
  const work = await getEntityByUri({ uri: workUri })
  if (work == null) throw error_.notFound({ workUri })

  const { type } = work
  if (type !== 'work') {
    throw error_.new(`unsupported type: ${type}, only work is supported`, 400, { workUri, work })
  }

  const editionsRes = await getEntitiesByIsbns([ isbn ], { refresh: true })
  const edition = editionsRes.entities[0]
  const editionWorksUris = edition.claims['wdt:P629']
  const editionWorksRes = await getEntitiesByUris({ uris: editionWorksUris })
  const editionWorks = Object.values(editionWorksRes.entities)
  const suggestions = await getSuggestionsOrAutomerge(work, editionWorks, userId)
  return tasks_.create(workUri, 'feedback', suggestions)
}

const getSuggestionsOrAutomerge = async (work, editionWorks, userId) => {
  const workLabels = Object.values(work.labels)
  for (const editionWork of editionWorks) {
    const editionWorkLabels = Object.values(editionWork.labels)
    if (haveExactMatch(workLabels, editionWorkLabels)) {
      await mergeEntities({ userId, fromUri: work.uri, toUri: editionWork.uri })
      return [] // no suggestions
    }
  }
  return editionWorks
}

// TODO: find a place to DRY haveExactMatch occurence in get_new_tasks.js
const haveExactMatch = (labels1, labels2) => {
  for (let label1 of labels1) {
    label1 = label1.toLowerCase()
    for (let label2 of labels2) {
      label2 = label2.toLowerCase()
      return label2.match(label1)
    }
  }
  return false
}

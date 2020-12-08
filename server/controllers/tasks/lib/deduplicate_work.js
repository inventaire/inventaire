const CONFIG = require('config')
const __ = CONFIG.universalPath
let error_ = __.require('lib', 'error/error')
const getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
const getEntitiesByUris = __.require('controllers', 'entities/lib/get_entities_by_uris')
const tasks_ = require('./tasks')
error_ = __.require('lib', 'error/error')
const getEntitiesByIsbns = __.require('controllers', 'entities/lib/get_entities_by_isbns')

module.exports = async (workUri, isbn, reqUserId) => {
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

  const suggestions = await getDeduplicate(work, editionWorks)

  return tasks_.create(workUri, 'feedback', suggestions)
}

const getDeduplicate = (work, editionWorks) => {
  // fake: return all editionWorks
  return editionWorks.map(editionWork => {
    return { uri: editionWork.uri }
  })
}

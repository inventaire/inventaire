const CONFIG = require('config')
const __ = CONFIG.universalPath
let error_ = __.require('lib', 'error/error')
const getEntityByUri = __.require('controllers', 'entities/lib/get_entity_by_uri')
const tasks_ = require('./tasks')
const getNewTasks = require('./get_new_tasks')
error_ = __.require('lib', 'error/error')
const updateRelationScore = require('./relation_score')
const supportedTypes = [ 'human' ]

module.exports = async uri => {
  if (uri.split(':')[0] !== 'inv') {
    throw error_.new('invalid uri domain', 400, { uri })
  }

  const entity = await getEntityByUri({ uri })
  if (entity == null) throw error_.notFound({ uri })

  if (entity.uri.split(':')[0] === 'wd') {
    throw error_.new('entity is already a redirection', 400, { uri })
  }
  const { type } = entity
  if (!supportedTypes.includes(type)) {
    throw error_.new(`unsupported type: ${type}`, 400, { uri, supportedTypes })
  }

  const existingTasks = await getExistingTasks(uri)
  const newSuggestions = await getNewTasks(entity, existingTasks)
  await tasks_.create(uri, 'deduplicate', entity.type, newSuggestions)
  await updateRelationScore(uri)
}

const getExistingTasks = uri => tasks_.bySuspectUris([ uri ])

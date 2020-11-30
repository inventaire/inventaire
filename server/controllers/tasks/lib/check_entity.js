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

  if (!supportedTypes.includes(entity.type)) {
    throw error_.new(`unsupported type: ${entity.type}`, 400, { uri, supportedTypes })
  }

  const existingTasks = await getExistingTasks(uri)
  const newSuggestions = await getNewTasks(entity, existingTasks)
  await createTasks(uri, 'deduplicate', newSuggestions)
  await updateRelationScore(uri)
}

const createTasks = async (suspectUri, type, suggestions) => {
  const newTasksObjects = suggestions.map(suggestion => {
    const { _score, uri: suggestionUri, occurrences } = suggestion

    const newTask = { type, suspectUri, suggestionUri }

    if (_score) { newTask.lexicalScore = _score }
    if (occurrences) { newTask.externalSourcesOccurrences = occurrences }
    return newTask
  })
  return tasks_.createInBulk(newTasksObjects)
}

const getExistingTasks = uri => tasks_.bySuspectUris([ uri ])

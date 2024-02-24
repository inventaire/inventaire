import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { createTasksFromSuggestions, getTasksBySuspectUris } from '#controllers/tasks/lib/tasks'
import { notFoundError, newError } from '#lib/error/error'
import { info } from '#lib/utils/logs'
import getNewTasks from './get_new_tasks.js'
import updateRelationScore from './relation_score.js'

const supportedTypes = [ 'human' ]

export default async function (uri) {
  info(`check entity: ${uri}`)

  if (uri.split(':')[0] !== 'inv') {
    throw newError('invalid uri domain', 400, { uri })
  }

  const entity = await getEntityByUri({ uri })
  if (entity == null) throw notFoundError({ uri })

  if ('_meta_type' in entity && entity._meta_type === 'removed:placeholder') return

  if (entity.uri.split(':')[0] === 'wd') {
    throw newError('entity is already a redirection', 400, { uri })
  }
  const { type } = entity
  if (!supportedTypes.includes(type)) {
    throw newError(`unsupported type: ${type}`, 400, { uri, supportedTypes })
  }

  const existingTasks = await getExistingTasks(uri)
  const newSuggestions = await getNewTasks(entity, existingTasks)
  await createTasksFromSuggestions({
    suspectUri: uri,
    type: 'deduplicate',
    entitiesType: entity.type,
    suggestions: newSuggestions,
  })

  await updateRelationScore(uri)
}

const getExistingTasks = uri => getTasksBySuspectUris([ uri ])

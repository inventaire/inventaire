import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { createTasksFromSuggestions, getTasksBySuspectUris } from '#controllers/tasks/lib/tasks'
import { error_ } from '#lib/error/error'
import { info } from '#lib/utils/logs'
import getNewSuggestionsOrAutomerge from './get_new_suggestions_or_automerge.js'
import updateRelationScore from './relation_score.js'

const supportedTypes = [ 'human' ]

export default async uri => {
  info(`check entity: ${uri}`)

  if (uri.split(':')[0] !== 'inv') {
    throw error_.new('invalid uri domain', 400, { uri })
  }

  const entity = await getEntityByUri({ uri })
  if (entity == null) throw error_.notFound({ uri })

  if (entity._meta_type === 'removed:placeholder') return

  if (entity.uri.split(':')[0] === 'wd') {
    throw error_.new('entity is already a redirection', 400, { uri })
  }
  const { type } = entity
  if (!supportedTypes.includes(type)) {
    throw error_.new(`unsupported type: ${type}`, 400, { uri, supportedTypes })
  }

  const existingTasks = await getExistingTasks(uri)
  const newSuggestions = await getNewSuggestionsOrAutomerge(entity, existingTasks)
  await createTasksFromSuggestions({
    suspectUri: uri,
    type: 'deduplicate',
    entitiesType: entity.type,
    suggestions: newSuggestions,
  })

  await updateRelationScore(uri)
}

const getExistingTasks = uri => getTasksBySuspectUris([ uri ])

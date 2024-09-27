import { map } from 'lodash-es'
import { getAuthorWorksData } from '#controllers/entities/lib/entities'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { updateTasks, getExistingTasks, createTasksFromSuggestions, getTasksBySuspectUri } from '#controllers/tasks/lib/tasks'
import type { SerializedEntity } from '#server/types/entity'
import type { EntityUri, EntityType } from '#types/entity'
import type { Task, Suggestion } from '#types/task'
import type { UserId } from '#types/user'

export async function getSuggestionsAndCreateTasks ({ entitiesType, toEntities, fromEntity, userId, clue }: { entitiesType?: EntityType, toEntities: SerializedEntity[], fromEntity: SerializedEntity, userId?: UserId, clue?: string }) {
  const existingTasks: Task[] = await getExistingTasks(fromEntity.uri)
  let newToEntities: SerializedEntity[] = filterNewSuggestionEntities(toEntities, existingTasks)
  const suggestions: Suggestion[] = map(newToEntities, addToSuggestion(userId, clue))

  return createTasksFromSuggestions({
    suspectUri: fromEntity.uri,
    type: 'deduplicate',
    entitiesType,
    suggestions,
  })
}

function filterNewSuggestionEntities (entities, existingTasks) {
  const existingTasksUris = map(existingTasks, 'suggestionUri')
  return entities.filter(entity => !existingTasksUris.includes(entity.uri))
}

const addToSuggestion = (userId, clue) => suggestion => {
  suggestion.reporter = userId
  suggestion.clue = clue
  return suggestion
}

export async function mergeOrCreateOrUpdateTask (entitiesType, fromUri, toUri, fromEntity, toEntity, userId) {
  const fromUriTasks = await getTasksBySuspectUri(fromUri, { index: false })
  const existingTask = fromUriTasks.find(task => task.suggestionUri === toUri)

  if (entitiesType === 'human') {
    const isMerged = await mergeIfWorksLabelsMatch(fromUri, toUri, fromEntity, toEntity, userId)
    if (isMerged) return
  }
  if (existingTask) {
    return updateTasks({
      ids: [ existingTask._id ],
      attribute: 'reporter',
      newValue: userId,
    })
  } else {
    return getSuggestionsAndCreateTasks({
      entitiesType,
      toEntities: [ toEntity ],
      fromEntity,
      userId,
    })
  }
}

export async function mergeIfWorksLabelsMatch (fromUri: EntityUri, toUri: EntityUri, fromEntity: SerializedEntity, toEntity: SerializedEntity, userId: UserId) {
  const [ fromEntityWorksData, toEntityWorksData ] = await Promise.all([
    getAuthorWorksData(fromEntity._id),
    getAuthorWorksData(toEntity._id),
  ])
  const { labels: fromEntityWorksLabels } = fromEntityWorksData
  const { labels: toEntityWorksLabels } = toEntityWorksData

  if (haveExactMatch(fromEntityWorksLabels, toEntityWorksLabels)) {
    await mergeEntities({
      userId,
      fromUri,
      toUri,
    })
    .then(() => { return true })
  }
  return false
}

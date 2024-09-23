import { map } from 'lodash-es'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { getExistingTasks, createTasksFromSuggestions } from '#controllers/tasks/lib/tasks'
import type { SerializedEntity } from '#server/types/entity'
import type { EntityType } from '#types/entity'
import type { UserId } from '#types/user'

export async function mergeOrCreateTasks ({ entitiesType, toEntities, fromEntity, userId, clue }: { entitiesType: EntityType, toEntities: SerializedEntity[], fromEntity: SerializedEntity, userId?: UserId, clue?: string }) {
  const suggestions = await getSuggestionsOrAutomerge(fromEntity, toEntities, userId)
  let newSuggestions = []
  if (userId) {
    newSuggestions = map(toEntities, addToSuggestion(userId, clue))
  } else {
    if (suggestions.length === 0) return
    const existingTasks = await getExistingTasks(fromEntity.uri)
    newSuggestions = await filterNewTasks(existingTasks, suggestions)
    newSuggestions = map(newSuggestions, addToSuggestion(userId, clue))
  }

  return createTasksFromSuggestions({
    suspectUri: fromEntity.uri,
    type: 'deduplicate',
    entitiesType,
    suggestions: newSuggestions,
  })
}

async function getSuggestionsOrAutomerge (fromEntity, toEntities, userId) {
  const workLabels = Object.values(fromEntity.labels)
  for (const toEntity of toEntities) {
    const toEntityLabels = Object.values(toEntity.labels)
    if (haveExactMatch(workLabels, toEntityLabels)) {
      await mergeEntities({
        userId,
        fromUri: fromEntity.uri,
        toUri: toEntity.uri,
      })
      return [] // no suggestions
    }
  }
  return toEntities
}

function filterNewTasks (existingTasks, suggestions) {
  const existingTasksUris = map(existingTasks, 'suggestionUri')
  return suggestions.filter(suggestion => !existingTasksUris.includes(suggestion.uri))
}

const addToSuggestion = (userId, clue) => suggestion => {
  suggestion.reporter = userId
  suggestion.clue = clue
  return suggestion
}

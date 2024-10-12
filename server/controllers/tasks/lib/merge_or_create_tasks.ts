import { map, uniq } from 'lodash-es'
import { getAuthorsFromWorksUris, getAuthorWorksData, getPublishersFromPublicationsUris } from '#controllers/entities/lib/entities'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { getEntityNormalizedTerms } from '#controllers/entities/lib/terms_normalization'
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

interface LabelsMatchMergeParams {
  fromUri: EntityUri
  toUri: EntityUri
  fromEntity: SerializedEntity
  toEntity: SerializedEntity
  userId: UserId
}
const mergeIfLabelsMatchByType = {
  work: async function ({ fromUri, toUri, fromEntity, toEntity, userId }: LabelsMatchMergeParams) {
    const [ fromEntityAuthors, toEntityAuthors ] = await Promise.all([
      getAuthorsFromWorksUris([ fromEntity.uri ]),
      getAuthorsFromWorksUris([ toEntity.uri ]),
    ])
    const fromLabels = uniq(fromEntityAuthors.flatMap(getEntityNormalizedTerms))
    const toLabels = uniq(toEntityAuthors.flatMap(getEntityNormalizedTerms))

    return validateAndMergeEntities({
      validation: haveExactMatch(fromLabels, toLabels),
      userId,
      fromUri,
      toUri,
    })
  },
  collection: async function ({ fromUri, toUri, fromEntity, toEntity, userId }: LabelsMatchMergeParams) {
    const [ fromPublishers, toPublishers ] = await Promise.all([
      getPublishersFromPublicationsUris([ fromEntity.uri ]),
      getPublishersFromPublicationsUris([ toEntity.uri ]),
    ])
    const fromLabels = uniq(fromPublishers.flatMap(getEntityNormalizedTerms))
    const toLabels = uniq(toPublishers.flatMap(getEntityNormalizedTerms))
    return validateAndMergeEntities({
      validation: haveExactMatch(fromLabels, toLabels),
      userId,
      fromUri,
      toUri,
    })
  },
  human: async function ({ fromUri, toUri, fromEntity, toEntity, userId }: LabelsMatchMergeParams) {
    const [ fromEntityWorksData, toEntityWorksData ] = await Promise.all([
      getAuthorWorksData(fromEntity._id),
      getAuthorWorksData(toEntity._id),
    ])
    const { labels: fromEntityWorksLabels } = fromEntityWorksData
    const { labels: toEntityWorksLabels } = toEntityWorksData
    return validateAndMergeEntities({
      validation: haveExactMatch(fromEntityWorksLabels, toEntityWorksLabels),
      userId,
      fromUri,
      toUri,
    })
  },
}

export async function mergeOrCreateOrUpdateTask (entitiesType, fromUri, toUri, fromEntity, toEntity, userId) {
  const mergeIfLabelsMatch = mergeIfLabelsMatchByType[entitiesType]
  if (mergeIfLabelsMatch) {
    const isMerged = await mergeIfLabelsMatch({ fromUri, toUri, fromEntity, toEntity, userId })
    if (isMerged) return isMerged
  }
  const fromUriTasks = await getTasksBySuspectUri(fromUri, { index: false })
  const existingTask = fromUriTasks.find(task => task.suggestionUri === toUri)
  let taskRes
  if (existingTask) {
    [ taskRes ] = await updateTasks({
      ids: [ existingTask._id ],
      attribute: 'reporter',
      newValue: userId,
    })
  } else {
    [ taskRes ] = await getSuggestionsAndCreateTasks({
      entitiesType,
      toEntities: [ toEntity ],
      fromEntity,
      userId,
    })
  }
  return {
    ok: true,
    taskId: taskRes.id,
  }
}

async function validateAndMergeEntities ({ validation, userId, fromUri, toUri }) {
  if (!validation) { return false }
  await mergeEntities({ userId, fromUri, toUri })
  return { ok: true }
}

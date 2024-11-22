import { map, uniq } from 'lodash-es'
import { getAuthorsFromWorksUris, getPublishersFromPublicationsUris } from '#controllers/entities/lib/entities'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { haveExactMatch } from '#controllers/entities/lib/labels_match'
import mergeEntities from '#controllers/entities/lib/merge_entities'
import { getEntityNormalizedTerms } from '#controllers/entities/lib/terms_normalization'
import { getAuthorWorksData } from '#controllers/tasks/lib/get_author_works_data'
import { updateTasks, getExistingTasks, createTasksFromSuggestions, getTasksBySuspectUri } from '#controllers/tasks/lib/tasks'
import { someMatch } from '#lib/utils/base'
import { log } from '#lib/utils/logs'
import type { SerializedEntity } from '#server/types/entity'
import type { EntityUri, EntityType } from '#types/entity'
import type { Task, Suggestion, TaskType } from '#types/task'
import type { UserId } from '#types/user'

export async function getSuggestionsAndCreateTasks ({ type = 'merge', entitiesType, toEntities, fromEntity, userId, clue }: { type: TaskType, entitiesType?: EntityType, toEntities: SerializedEntity[], fromEntity: SerializedEntity, userId?: UserId, clue?: string }) {
  const existingTasks: Task[] = await getExistingTasks(fromEntity.uri)
  const newToEntities: SerializedEntity[] = filterNewSuggestionEntities(toEntities, existingTasks)
  const suggestions: Suggestion[] = map(newToEntities, addToSuggestion(userId, clue))
  const suspectUri = fromEntity.uri

  log({ suspectUri, suggestions: map(suggestions, 'uri') }, 'creating tasks from suggestions')
  return createTasksFromSuggestions({
    suspectUri,
    type,
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
    const fromAuthorsLabels = uniq(fromEntityAuthors.flatMap(getEntityNormalizedTerms))
    const toAuthorsLabels = uniq(toEntityAuthors.flatMap(getEntityNormalizedTerms))

    const fromWorkLabels = getEntityNormalizedTerms(fromEntity)
    const toWorkLabels = getEntityNormalizedTerms(toEntity)
    // see test: should create a task when authors have the same URI but no works labels match
    if (!haveExactMatch(fromWorkLabels, toWorkLabels) && someUrisMatch(fromEntityAuthors, toEntityAuthors)) {
      return
    }

    return validateAndMergeEntities({
      validation: haveExactMatch(fromAuthorsLabels, toAuthorsLabels),
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
  edition: async function ({ fromUri, toUri, fromEntity, toEntity, userId }: LabelsMatchMergeParams) {
    const [ fromEditionWorks, toEditionWorks ] = await Promise.all([
      getEditionWorks(fromEntity),
      getEditionWorks(toEntity),
    ])
    const fromLabels = uniq(fromEditionWorks.flatMap(getEntityNormalizedTerms))
    const toLabels = uniq(toEditionWorks.flatMap(getEntityNormalizedTerms))
    return validateAndMergeEntities({
      validation: haveExactMatch(fromLabels, toLabels),
      userId,
      fromUri,
      toUri,
    })
  },
}

async function getEditionWorks (edition) {
  const worksUris = edition.claims['wdt:P629'] as EntityUri[]
  return getEntitiesList(worksUris)
}

export async function mergeOrCreateOrUpdateTask (entitiesType: EntityType, fromUri: EntityUri, toUri: EntityUri, fromEntity: SerializedEntity, toEntity: SerializedEntity, userId: UserId) {
  const mergeIfLabelsMatch = mergeIfLabelsMatchByType[entitiesType]
  if (mergeIfLabelsMatch) {
    const isMerged = await mergeIfLabelsMatch({ fromUri, toUri, fromEntity, toEntity, userId })
    if (isMerged) {
      log({ fromUri, toUri }, 'entities have been merged')
      return isMerged
    }
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

function someUrisMatch (fromEntityAuthors, toEntityAuthors) {
  const fromUris = map(fromEntityAuthors, 'uri')
  const toUris = map(toEntityAuthors, 'uri')
  return someMatch(fromUris, toUris)
}

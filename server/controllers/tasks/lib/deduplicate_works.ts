import { isEqual } from 'lodash-es'
import { getEntitiesByIsbns } from '#controllers/entities/lib/get_entities_by_isbns'
import { getEntitiesList } from '#controllers/entities/lib/get_entities_list'
import { getEntityByUri } from '#controllers/entities/lib/get_entity_by_uri'
import { mergeOrCreateTasks } from '#controllers/tasks/lib/merge_or_create_tasks'
import { newError, notFoundError } from '#lib/error/error'
import type { EntityUri } from '#server/types/entity'

export default async function (workUri, isbn, userId) {
  const work = await getEntityByUri({ uri: workUri })
  if (work == null) throw notFoundError({ workUri })

  // Make sure workUri isn't a redirection
  workUri = work.uri

  const { type } = work
  if (type !== 'work') {
    throw newError(`unsupported type: ${type}, only work is supported`, 400, { workUri, work })
  }
  const editionsRes = await getEntitiesByIsbns([ isbn ])
  const edition = editionsRes.entities[0]
  const editionWorksUris = edition.claims['wdt:P629'] as EntityUri[]
  if (isEqual(editionWorksUris, [ workUri ])) return
  const editionWorks = await getEntitiesList(editionWorksUris)
  return mergeOrCreateTasks({
    entitiesType: type,
    toEntities: editionWorks,
    fromEntity: work,
    userId,
    clue: isbn,
  })
}

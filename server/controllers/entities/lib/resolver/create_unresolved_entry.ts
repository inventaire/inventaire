import type { ResolverBatchParams } from '#controllers/entities/lib/resolver/resolve_update_and_create'
import type { BatchId } from '#server/types/patch'
import type { EntitySeed, SanitizedResolverEntry } from '#server/types/resolver'
import type { UserId } from '#server/types/user'
import { createEdition, createWork, createAuthor } from './create_entity_from_seed.js'

export async function createUnresolvedEntry (entry: SanitizedResolverEntry, { reqUserId, batchId, enrich }: ResolverBatchParams) {
  const { edition, works, authors } = entry

  // If the edition has been resolved but not its associated works
  // creating new works would make them be created without any associated edition
  if (edition.resolved) {
    works.forEach(addNotCreatedFlag)
    authors.forEach(addNotCreatedFlag)
    return entry
  }

  // Create authors before works, so that the created entities uris
  // can be set on the entry, and used in works claims
  await createAuthors(entry, reqUserId, batchId)
  // Idem for works being created before the edition
  await createWorks(entry, reqUserId, batchId)
  await createEdition(edition, works, reqUserId, batchId, enrich)
  return entry
}

function createAuthors (entry: SanitizedResolverEntry, reqUserId: UserId, batchId: BatchId) {
  const { authors } = entry
  return Promise.all(authors.map(createAuthor(reqUserId, batchId)))
}

function createWorks (entry: SanitizedResolverEntry, reqUserId: UserId, batchId: BatchId) {
  const { works, authors } = entry
  return Promise.all(works.map(createWork(reqUserId, batchId, authors)))
}

function addNotCreatedFlag (seed: EntitySeed) {
  seed.created = false
}

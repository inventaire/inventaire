import { property, uniq } from 'lodash-es'
import { getEntitiesByUris } from '#controllers/entities/lib/get_entities_by_uris'
import { isNonEmptyArray } from '#lib/boolean_validations'
import { error_ } from '#lib/error/error'
import { flatMapUniq, mapUniq } from '#lib/utils/base'
import { validateVisibilityKeys } from '#lib/visibility/visibility'

const allowlistedEntityTypes = new Set([ 'edition', 'work' ])

let getShelvesByIds
const importCircularDependencies = async () => {
  ({ getShelvesByIds } = await import('#controllers/shelves/lib/shelves'))
}
setImmediate(importCircularDependencies)

export async function validateItemsAsync (items) {
  const owners = mapUniq(items, 'owner')
  if (owners.length !== 1) {
    throw error_.new('items should belong to a unique owner', 500, { items })
  }
  const userId = owners[0]
  const shelvesIds = flatMapUniq(items, 'shelves')
  const visibilityKeys = flatMapUniq(items, 'visibility')

  await Promise.all([
    validateEntities(items),
    validateShelves(userId, shelvesIds),
    validateVisibilityKeys(visibilityKeys, userId),
  ])
  .catch(err => {
    error_.addContext(err, { userId, items })
    throw err
  })
}

const validateEntities = async items => {
  const uris = mapUniq(items, 'entity')
  const { entities, redirects, notFound } = await getEntitiesByUris({ uris })
  if (notFound?.length > 0) {
    throw error_.new('some entities could not be found', 400, { uris, notFound })
  }
  if (redirects && Object.keys(redirects).length > 0) {
    throw error_.new('some entities are redirections', 400, { redirects })
  }
  Object.values(entities).forEach(validateEntityType)
}

const validateEntityType = entity => {
  const { type } = entity
  if (!allowlistedEntityTypes.has(type)) {
    throw error_.new('invalid entity type', 400, { type })
  }
}

export async function validateShelves (userId, shelvesIds) {
  const shelves = await getShelvesByIds(shelvesIds)
  validateShelvesOwnership(userId, shelves)
}

const validateShelvesOwnership = (userId, shelves) => {
  if (isNonEmptyArray(shelves)) {
    const shelvesOwners = shelves.map(property('owner'))
    const allShelvesBelongToUser = uniq(shelvesOwners)[0] === userId

    if (!allShelvesBelongToUser) {
      throw error_.new('invalid owner', 400, { userId })
    }
  }
}

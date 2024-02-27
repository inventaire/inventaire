import { cloneDeep, keyBy, map } from 'lodash-es'
import { getInvClaimsByClaimValue, getEntitiesByIds, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { retryOnConflict } from '#lib/retry_on_conflict'
import { log } from '#lib/utils/logs'
import Entity from '#models/entity'

async function _redirectClaims (userId, fromUri, toUri) {
  const results = await getInvClaimsByClaimValue(fromUri)
  const entitiesToEditIds = map(results, 'entity')
  log(entitiesToEditIds, 'entitiesToEditIds')
  if (entitiesToEditIds.length === 0) return
  // Doing all the redirects at once to avoid conflicts
  // within a same entity pointing several times to the redirected entity.
  // There is no identified case at the moment though.
  const entities = await getEntitiesByIds(entitiesToEditIds)
  return redirectEntitiesClaims({ results, userId, fromUri, toUri, entities })
}

const redirectEntitiesClaims = ({ results, userId, fromUri, toUri, entities }) => {
  const entitiesIndex = keyBy(entities, '_id')
  const entitiesIndexBeforeUpdate = cloneDeep(entitiesIndex)

  // Apply all the redirection updates on the entities docs
  results.forEach(applyRedirections(entitiesIndex, fromUri, toUri))

  // Then, post the updates all at once
  const updatesPromises = Object.values(entitiesIndex).map(updatedDoc => {
    const currentDoc = entitiesIndexBeforeUpdate[updatedDoc._id]
    // Add a context in case we need to revert those redirections later on
    const context = { redirectClaims: { fromUri } }
    return putInvEntityUpdate({ userId, currentDoc, updatedDoc, context })
  })

  return Promise.all(updatesPromises)
}

const applyRedirections = (entitiesIndex, fromUri, toUri) => result => {
  let newVal
  const { property, entity } = result
  const doc = entitiesIndex[entity]

  // If the toUri is already a claim value, delete the fromUri claim
  // instead of creating a duplicated claim
  if (doc.claims[property].includes(toUri)) {
    newVal = null
  } else {
    newVal = toUri
  }

  entitiesIndex[entity] = Entity.updateClaim(doc, property, fromUri, newVal)
}

export const redirectClaims = retryOnConflict({ updateFn: _redirectClaims })
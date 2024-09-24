import { cloneDeep, isEqual } from 'lodash-es'
import { getEntitiesByIds, putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { newError } from '#lib/error/error'
import { emit } from '#lib/radio'
import { assert_ } from '#lib/utils/assert_types'
import { info } from '#lib/utils/logs'
import { mergeEntitiesDocs } from '#models/entity'
import type { EntityUri } from '#types/entity'
import type { PatchContext } from '#types/patch'
import type { UserId } from '#types/user'
import { getInvEntityCanonicalUri } from './get_inv_entity_canonical_uri.js'
import { turnIntoRedirectionOrLocalLayer } from './turn_into_redirection.js'

export default async function ({ userId, fromUri, toUri, context }: { userId: UserId, fromUri: EntityUri, toUri: EntityUri, context?: PatchContext }) {
  let [ fromPrefix, fromId ] = fromUri.split(':')
  let [ toPrefix, toId ] = toUri.split(':')

  if (fromPrefix === 'wd') {
    if (toPrefix === 'inv') {
      info({ fromUri, toUri }, 'merge: switching fromUri and toUri');
      [ fromPrefix, fromId, toPrefix, toId ] = [ toPrefix, toId, fromPrefix, fromId ]
    } else {
      throw newError('cannot merge wd entites', 500, { fromUri, toUri })
    }
  }

  if (toPrefix === 'wd') {
    // no merge to do for Wikidata entities, simply creating a redirection or a local layer
    await turnIntoRedirectionOrLocalLayer({ userId, fromId, toUri, context })
  } else {
    // TODO: invert fromId and toId if the merged entity is more popular
    // to reduce the amount of documents that need to be updated
    await mergeInvEntities(userId, fromId, toId)
  }
  await emit('entity:merge', fromUri, toUri)
}

async function mergeInvEntities (userId, fromId, toId) {
  assert_.strings([ userId, fromId, toId ])

  // Fetching non-formmatted docs
  const [ fromEntityDoc, toEntityDoc ] = await getEntitiesByIds([ fromId, toId ])
  // At this point if the entities are not found, that's the server's fault,
  // thus the 500 statusCode
  if (fromEntityDoc._id !== fromId) {
    throw newError("'from' entity doc not found", 500)
  }
  if (fromEntityDoc.type === 'removed:placeholder') {
    throw newError("'from' entity doc is a removed:placeholder", 500)
  }

  if (toEntityDoc._id !== toId) {
    throw newError("'to' entity doc not found", 500)
  }
  if (toEntityDoc.type === 'removed:placeholder') {
    throw newError("'to' entity doc is a removed:placeholder", 500)
  }

  const previousToUri = getInvEntityCanonicalUri(toEntityDoc)

  // Transfer all data from the 'fromEntity' to the 'toEntity'
  // if any difference can be found
  const toEntityDocBeforeMerge = cloneDeep(toEntityDoc)
  const toEntityDocAfterMerge = mergeEntitiesDocs(fromEntityDoc, toEntityDoc)

  // If the doc hasn't changed, don't run putInvEntityUpdate
  // as it will throw an 'empty patch' error
  if (!isEqual(toEntityDocBeforeMerge, toEntityDocAfterMerge)) {
    await putInvEntityUpdate({
      userId,
      currentDoc: toEntityDocBeforeMerge,
      updatedDoc: toEntityDocAfterMerge,
      context: { mergeFrom: `inv:${fromId}` },
    })
  }

  // Refresh the URI in case an ISBN was transfered and the URI changed
  const toUri = getInvEntityCanonicalUri(toEntityDocAfterMerge)

  return turnIntoRedirectionOrLocalLayer({ userId, fromId, toUri, previousToUri })
}

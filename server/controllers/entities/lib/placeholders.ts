// Placeholders are entities automatically created without checking that a similar
// entity existed locally or in Wikidata. Those entities have thus high chances
// to be duplicates and to be deleted by merge operations.

// But mistakes happen, and some merges will need to be reverted:
// thus the remove/recover mechanism hereafter

import { putInvEntityUpdate } from '#controllers/entities/lib/entities'
import { dbFactory } from '#db/couchdb/base'
import { emit } from '#lib/radio'
import { warn } from '#lib/utils/logs'
import { convertEntityDocToPlaceholder, recoverEntityDocFromPlaceholder } from '#models/entity'
import type { InvEntityDoc, InvEntityId, RemovedPlaceholderEntity } from '#types/entity'
import type { UserAccountUri } from '#types/server'

const db = await dbFactory('entities')

export async function removePlaceholder (userAcct: UserAccountUri, entityId: InvEntityId) {
  warn(entityId, 'removing placeholder entity')
  const currentDoc = await db.get<InvEntityDoc>(entityId)
  if (currentDoc.type === 'removed:placeholder') {
    warn(entityId, 'this entity is already a removed:placeholder: ignored')
    return
  }
  if ('redirect' in currentDoc) {
    warn(entityId, 'this entity is a redirection: ignored')
    return
  }
  try {
    const updatedDoc = convertEntityDocToPlaceholder(currentDoc)
    await putInvEntityUpdate<RemovedPlaceholderEntity>({ userAcct, currentDoc, updatedDoc })
    await emit('entity:remove', `inv:${entityId}`)
    return currentDoc._id
  } catch (err) {
    if (err.message === "can't turn a redirection into a removed placeholder") {
      // Ignore this error as the effects of those two states are close
      // (so much so that it might be worth just having redirections)
      warn(currentDoc, err.message)
    } else {
      throw err
    }
  }
}

export async function recoverPlaceholder (userAcct: UserAccountUri, entityId: InvEntityId) {
  warn(entityId, 'recovering placeholder entity')
  const currentDoc = await db.get<InvEntityDoc>(entityId)
  if (currentDoc.type !== 'removed:placeholder') {
    warn(entityId, 'this entity is not a removed:placeholder: ignored')
    return
  }
  const updatedDoc = recoverEntityDocFromPlaceholder(currentDoc)
  await putInvEntityUpdate<InvEntity>({ userAcct, currentDoc, updatedDoc })
  await emit('entity:recover', `inv:${entityId}`)
  return currentDoc._id
}

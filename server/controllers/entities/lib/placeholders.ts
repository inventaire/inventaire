// Placeholders are entities automatically created without checking that a similar
// entity existed locally or in Wikidata. Those entities have thus high chances
// to be duplicates and to be deleted by merge operations.

// But mistakes happen, and some merges will need to be reverted:
// thus the remove/recover mechanism hereafter

import { putInvEntityUpdate } from '#controllers/entities/lib/entities'
import dbFactory from '#db/couchdb/base'
import { emit } from '#lib/radio'
import { warn } from '#lib/utils/logs'
import Entity from '#models/entity'

const db = await dbFactory('entities')

const PlaceholderHandler = actionName => {
  const modelFnName = `${actionName}Placeholder`
  return async (userId, entityId) => {
    warn(entityId, `${modelFnName} entity`)
    // Using db.get anticipates a possible future where db.byId filters-out
    // non type='entity' docs, thus making type='removed:placeholder' not accessible
    const currentDoc = await db.get(entityId)
    if (actionName === 'remove' && currentDoc.type === 'removed:placeholder') {
      warn(entityId, 'this entity is already a removed:placeholder: ignored')
      return
    }
    let updatedDoc
    try {
      updatedDoc = Entity[modelFnName](currentDoc)
    } catch (err) {
      if (err.message === "can't turn a redirection into a removed placeholder") {
        // Ignore this error as the effects of those two states are close
        // (so much so that it might be worth just having redirections)
        warn(currentDoc, err.message)
        return
      } else {
        throw err
      }
    }

    await putInvEntityUpdate({ userId, currentDoc, updatedDoc })
    await emit(`entity:${actionName}`, `inv:${entityId}`)
    return currentDoc._id
  }
}

export const removePlaceholder = PlaceholderHandler('remove')
export const recoverPlaceholder = PlaceholderHandler('recover')

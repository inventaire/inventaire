// Placeholders are entities automatically created without checking that a similar
// entity existed locally or in Wikidata. Those entities have thus high chances
// to be duplicates and to be deleted by merge operations.

// But mistakes happen, and some merges will need to be reverted:
// thus the remove/recover mechanism hereafter

const _ = require('builders/utils')
const entities_ = require('./entities')
const Entity = require('models/entity')
const { emit } = require('lib/radio')
const db = require('db/couchdb/base')('entities')

const PlaceholderHandler = actionName => {
  const modelFnName = `${actionName}Placeholder`
  return async (userId, entityId) => {
    _.warn(entityId, `${modelFnName} entity`)
    // Using db.get anticipates a possible future where db.byId filters-out
    // non type='entity' docs, thus making type='removed:placeholder' not accessible
    const currentDoc = await db.get(entityId)
    if (actionName === 'remove' && currentDoc.type === 'removed:placeholder') {
      _.warn(entityId, 'this entity is already a removed:placeholder: ignored')
      return
    }
    let updatedDoc
    try {
      updatedDoc = Entity[modelFnName](currentDoc)
    } catch (err) {
      if (err.message === "can't turn a redirection into a removed placeholder") {
        // Ignore this error as the effects of those two states are close
        // (so much so that it might be worth just having redirections)
        _.warn(currentDoc, err.message)
        return
      } else {
        throw err
      }
    }

    await entities_.putUpdate({ userId, currentDoc, updatedDoc })
    await emit(`entity:${actionName}`, `inv:${entityId}`)
    return currentDoc._id
  }
}

module.exports = {
  remove: PlaceholderHandler('remove'),
  recover: PlaceholderHandler('recover')
}

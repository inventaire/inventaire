import { isPlainObject } from 'lodash-es'
import { createItems } from '#controllers/items/lib/items'
import { isEntityUri } from '#lib/boolean_validations'
import { newMissingBodyError, newInvalidError } from '#lib/error/pre_filled'
import { track } from '#lib/track'
import { forceArray } from '#lib/utils/base'
import { log } from '#lib/utils/logs'
import type { Item } from '#types/item'
import { addSnapshotToItem } from './lib/snapshot/snapshot.js'

export default async function (req, res) {
  let { body: items, user } = req
  const singleItemMode = isPlainObject(items)

  items = forceArray(items)

  log(items, 'create items')

  for (const item of items) {
    const { entity: entityUri } = item
    if (entityUri == null) throw newMissingBodyError('entity')

    if (!isEntityUri(entityUri)) {
      throw newInvalidError('entity', entityUri)
    }
  }

  const itemsDocs = await createItems(user._id, items)
  const itemsWithSnaphots = await getItemsWithSnapshots(itemsDocs, singleItemMode)
  res.status(201).json(itemsWithSnaphots)
  track(req, [ 'item', 'creation', null, items.length ])
}

async function getItemsWithSnapshots (itemsDocs: Item[], singleItemMode: boolean) {
  // When only one item was sent, without being wrapped in an array
  // return the created item object, instead of an array
  if (singleItemMode) {
    return addSnapshotToItem(itemsDocs[0])
  } else {
    return Promise.all(itemsDocs.map(addSnapshotToItem))
  }
}

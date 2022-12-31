import _ from 'builders/utils'
import items_ from 'controllers/items/lib/items'
import snapshot_ from './lib/snapshot/snapshot'
import error_ from 'lib/error/error'
import { track } from 'lib/track'

export default async (req, res) => {
  let { body: items, user } = req
  const singleItemMode = _.isPlainObject(items)

  items = _.forceArray(items)

  _.log(items, 'create items')

  for (const item of items) {
    const { entity: entityUri } = item
    if (entityUri == null) throw error_.newMissingBody('entity')

    if (!_.isEntityUri(entityUri)) {
      throw error_.newInvalid('entity', entityUri)
    }
  }

  const itemsDocs = await items_.create(user._id, items)
  const itemsWithSnaphots = await getItemsWithSnapshots(itemsDocs, singleItemMode)
  res.status(201).json(itemsWithSnaphots)
  track(req, [ 'item', 'creation', null, items.length ])
}

const getItemsWithSnapshots = async (itemsDocs, singleItemMode) => {
  // When only one item was sent, without being wrapped in an array
  // return the created item object, instead of an array
  if (singleItemMode) {
    return snapshot_.addToItem(itemsDocs[0])
  } else {
    return Promise.all(itemsDocs.map(snapshot_.addToItem))
  }
}

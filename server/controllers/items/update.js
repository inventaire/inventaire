import _ from '#builders/utils'
import items_ from '#controllers/items/lib/items'
import error_ from '#lib/error/error'
import responses_ from '#lib/responses'
import { track } from '#lib/track'
import snapshot_ from './lib/snapshot/snapshot.js'

// This controller doesn't use sanitization
// as the item doc is passed unwrapped in the body
export default async (req, res) => {
  const { body: item } = req
  const { _id, entity } = item

  // Remove if passed accidentally as it is included in the server responses
  delete item.snapshot

  _.log(item, 'item update')

  if (_id == null) throw error_.newMissingBody('_id')
  if (entity == null) throw error_.newMissingBody('entity')

  if (!_.isItemId(_id)) {
    throw error_.newInvalid('_id', _id)
  }

  if (!_.isEntityUri(entity)) {
    throw error_.newInvalid('entity', entity)
  }

  const reqUserId = req.user._id

  await items_.update(reqUserId, item)
    .then(snapshot_.addToItem)
    .then(responses_.Send(res))

  track(req, [ 'item', 'update' ])
}

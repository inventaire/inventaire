import { updateItems } from '#controllers/items/lib/items'
import { checkSpamContent } from '#controllers/user/lib/spam'
import { isEntityUri, isItemId } from '#lib/boolean_validations'
import { newMissingBodyError, newInvalidError } from '#lib/error/pre_filled'
import { responses_ } from '#lib/responses'
import { track } from '#lib/track'
import { log } from '#lib/utils/logs'
import { addSnapshotToItem } from './lib/snapshot/snapshot.js'

// This controller doesn't use sanitization
// as the item doc is passed unwrapped in the body
export default async function (req, res) {
  const { body: item } = req
  const { _id, entity } = item

  // Remove if passed accidentally as it is included in the server responses
  delete item.snapshot

  log(item, 'item update')

  if (_id == null) throw newMissingBodyError('_id')
  if (entity == null) throw newMissingBodyError('entity')

  if (!isItemId(_id)) {
    throw newInvalidError('_id', _id)
  }

  if (!isEntityUri(entity)) {
    throw newInvalidError('entity', entity)
  }

  await checkSpamContent(req.user, item.details)

  const reqUserId = req.user._id

  await updateItems(reqUserId, item)
    .then(addSnapshotToItem)
    .then(responses_.Send(res))

  track(req, [ 'item', 'update' ])
}

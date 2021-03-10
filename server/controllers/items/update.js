const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const snapshot_ = require('./lib/snapshot/snapshot')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const { Track } = require('lib/track')

module.exports = (req, res) => {
  if (req.user == null) return error_.unauthorizedApiAccess(req, res)
  const { body: item } = req
  const { _id, entity } = item

  // Remove if passed accidentally as it is included in the server responses
  delete item.snapshot

  _.log(item, 'item update')

  if (_id == null) return error_.bundleMissingBody(req, res, '_id')
  if (entity == null) return error_.bundleMissingBody(req, res, 'entity')

  if (!_.isItemId(_id)) {
    return error_.bundleInvalid(req, res, '_id', _id)
  }

  if (!_.isEntityUri(entity)) {
    return error_.bundleInvalid(req, res, 'entity', entity)
  }

  const reqUserId = req.user._id

  return items_.update(reqUserId, item)
  .then(snapshot_.addToItem)
  .then(responses_.Send(res))
  .then(Track(req, [ 'item', 'update' ]))
  .catch(error_.Handler(req, res))
}

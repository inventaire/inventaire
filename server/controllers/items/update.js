// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const items_ = __.require('controllers', 'items/lib/items')
const snapshot_ = require('./lib/snapshot/snapshot')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const radio = __.require('lib', 'radio')
const { Track } = __.require('lib', 'track')

module.exports = (req, res, next) => {
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
  const itemId = item._id

  return items_.update(reqUserId, item)
  .then(snapshot_.addToItem)
  .then(responses_.Send(res))
  .tap(Track(req, [ 'item', 'update' ]))
  .catch(error_.Handler(req, res))
}

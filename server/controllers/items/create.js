const _ = require('builders/utils')
const items_ = require('controllers/items/lib/items')
const snapshot_ = require('./lib/snapshot/snapshot')
const error_ = require('lib/error/error')
const { Track } = require('lib/track')

module.exports = (req, res) => {
  let { body: items, user } = req
  const singleItemMode = _.isPlainObject(items)

  items = _.forceArray(items)

  _.log(items, 'create items')

  for (const item of items) {
    const { entity: entityUri } = item
    if (entityUri == null) return error_.bundleMissingBody(req, res, 'entity')

    if (!_.isEntityUri(entityUri)) {
      return error_.bundleInvalid(req, res, 'entity', entityUri)
    }
  }

  return items_.create(user._id, items)
  .then(getItemsWithSnapshots(singleItemMode))
  .then(data => res.status(201).json(data))
  .then(Track(req, [ 'item', 'creation', null, items.length ]))
}

const getItemsWithSnapshots = singleItemMode => async itemsDocs => {
  // When only one item was sent, without being wrapped in an array
  // return the created item object, instead of an array
  if (singleItemMode) {
    return snapshot_.addToItem(itemsDocs[0])
  } else {
    return Promise.all(itemsDocs.map(snapshot_.addToItem))
  }
}

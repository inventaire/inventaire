const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const responses_ = __.require('lib', 'responses')
const items_ = __.require('controllers', 'items/lib/items')
const snapshot_ = __.require('controllers', 'items/lib/snapshot/snapshot')
const transactions_ = require('./lib/transactions')
const user_ = __.require('controllers', 'user/lib/user')
const sanitize = __.require('lib', 'sanitize/sanitize')
const { Track } = __.require('lib', 'track')

const sanitization = {
  item: {},
  message: {}
}

module.exports = (req, res, nex) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { item, message, reqUserId } = params

    _.log([ item, message ], 'item request')

    return items_.byId(item)
    .then(transactions_.verifyRightToRequest.bind(null, reqUserId))
    .then(snapshot_.addToItem)
    .then(itemDoc => {
      const { owner: ownerId } = itemDoc
      return user_.byIds([ ownerId, reqUserId ])
      .spread(transactions_.create.bind(null, itemDoc))
    })
    .get('id')
    .then(id => transactions_.addMessage(reqUserId, message, id)
    .then(() => transactions_.byId(id))).then(responses_.Wrap(res, 'transaction'))
  })
  .then(Track(req, [ 'transaction', 'request' ]))
  .catch(error_.Handler(req, res))
}

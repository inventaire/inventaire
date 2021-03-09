const _ = require('builders/utils')
const error_ = require('lib/error/error')
const responses_ = require('lib/responses')
const items_ = require('controllers/items/lib/items')
const snapshot_ = require('controllers/items/lib/snapshot/snapshot')
const transactions_ = require('./lib/transactions')
const user_ = require('controllers/user/lib/user')
const sanitize = require('lib/sanitize/sanitize')
const { Track } = require('lib/track')
const { verifyRightToRequest } = require('./lib/rights_verification')

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
    .then(verifyRightToRequest.bind(null, reqUserId))
    .then(snapshot_.addToItem)
    .then(itemDoc => {
      const { owner: ownerId } = itemDoc
      return user_.byIds([ ownerId, reqUserId ])
      .then(([ ownerDoc, requesterDoc ]) => transactions_.create(itemDoc, ownerDoc, requesterDoc))
    })
    .then(({ id }) => id)
    .then(id => {
      return transactions_.addMessage(reqUserId, message, id)
      .then(() => transactions_.byId(id))
    })
  })
  .then(responses_.Wrap(res, 'transaction'))
  .then(Track(req, [ 'transaction', 'request' ]))
  .catch(error_.Handler(req, res))
}

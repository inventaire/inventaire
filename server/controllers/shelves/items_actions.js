const __ = require('config').universalPath
const _ = require('builders/utils')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const { Track } = require('lib/track')
const shelves_ = require('controllers/shelves/lib/shelves')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  id: {},
  items: {}
}

const itemsActions = action => (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(({ id, items, reqUserId }) => {
    return shelves_[action]([ id ], items, reqUserId)
  })
  .then(_.KeyBy('_id'))
  .then(responses_.Wrap(res, 'shelves'))
  .then(Track(req, [ 'shelf', action ]))
  .catch(error_.Handler(req, res))
}

module.exports = {
  addItems: itemsActions('addItems'),
  removeItems: itemsActions('removeItems')
}

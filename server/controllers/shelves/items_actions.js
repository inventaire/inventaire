const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  id: {},
  items: {}
}

const itemsActions = action => (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { id, items, reqUserId } = params
    return shelves_[action]([ id ], items, reqUserId)
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'shelves'))
    .then(Track(req, [ 'shelf', action ]))
  })
  .catch(error_.Handler(req, res))
}

module.exports = {
  addItems: itemsActions('addItems'),
  removeItems: itemsActions('removeItems')
}

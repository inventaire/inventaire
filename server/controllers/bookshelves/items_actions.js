const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Track } = __.require('lib', 'track')
const bookshelves_ = __.require('controllers', 'bookshelves/lib/bookshelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  id: {},
  items: {}
}

module.exports = action => (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { id, items, reqUserId } = params
    // don't convert undefined action to an empty string
    // it makes debugging confusing
    if (action != null) { action = _.camelCase(action) }

    return bookshelves_[action]([ id ], items, reqUserId)
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'bookshelves'))
    .then(Track(req, [ 'bookshelf', 'delete items' ]))
  })
  .catch(error_.Handler(req, res))
}

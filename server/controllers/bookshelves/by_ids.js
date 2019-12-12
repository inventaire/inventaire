const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const bookshelves_ = __.require('controllers', 'bookshelves/lib/bookshelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { ids, withItems } = params
    const byIdsFnName = withItems === true ? 'byIdsWithItems' : 'byIds'
    return bookshelves_[byIdsFnName](ids)
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'bookshelves'))
  })
  .catch(error_.Handler(req, res))
}

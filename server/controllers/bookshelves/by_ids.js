const __ = require('config').universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const bookshelves_ = __.require('controllers', 'bookshelves/lib/bookshelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  ids: {}
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    return bookshelves_.byIds(params.ids)
    .then(responses_.Wrap(res, 'bookshelves'))
  })
  .catch(error_.Handler(req, res))
}

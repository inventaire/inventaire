const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const bookshelves_ = __.require('controllers', 'bookshelves/lib/bookshelves')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true },
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { withItems } = params
    let { owners } = params
    owners = _.forceArray(owners)
    const byOwnersFnName = withItems === true ? 'byOwnersWithItems' : 'byOwners'
    return bookshelves_[byOwnersFnName](owners)
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'bookshelves'))
  })
  .catch(error_.Handler(req, res))
}

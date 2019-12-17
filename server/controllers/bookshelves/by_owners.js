const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const promises_ = __.require('lib', 'promises')
const bookshelves_ = __.require('controllers', 'bookshelves/lib/bookshelves')
const relations_ = __.require('controllers', 'relations/lib/queries')
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
    const { withItems, reqUserId } = params
    let { owners } = params
    owners = _.forceArray(owners)
    const byOwnersFnName = withItems === true ? 'byOwnersWithItems' : 'byOwners'
    return promises_.all([ bookshelves_[byOwnersFnName](owners), getNetworkIds(reqUserId) ])
    .spread(filterAuthorisedBookshelves)
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'bookshelves'))
  })
  .catch(error_.Handler(req, res))
}

const filterAuthorisedBookshelves = (bookshelves, networkIds) => {
  return bookshelves.filter(isAuthorised(networkIds))
}

const isAuthorised = networkIds => bookshelf => {
  if (bookshelf.listing === 'private') { return false }
  if (bookshelf.listing === 'public') { return true }
  if (bookshelf.listing === 'network' && networkIds.includes(bookshelf.owner)) { return true }
}
const getNetworkIds = reqUserId => {
  if (reqUserId) {
    return relations_.getUserFriendsAndCoGroupsMembers(reqUserId)
  } else return []
}

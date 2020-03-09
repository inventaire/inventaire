const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const relations_ = __.require('controllers', 'relations/lib/queries')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { reqUserId } = params
    let { owners } = params
    owners = _.forceArray(owners)
    return Promise.all([ shelves_.byOwners(owners), getNetworkIds(reqUserId) ])
    .then(filterAuthorisedShelves(reqUserId))
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'shelves'))
  })
  .catch(error_.Handler(req, res))
}

const filterAuthorisedShelves = reqUserId => ([ shelves, networkIds ]) => {
  return shelves.filter(isAuthorised(networkIds, reqUserId))
}

const isAuthorised = (networkIds, reqUserId) => shelf => {
  if (shelf.listing === 'private' && shelf.owner === reqUserId) return true
  if (shelf.listing === 'public') return true
  if (shelf.listing === 'network' && networkIds.includes(shelf.owner)) return true
}
const getNetworkIds = reqUserId => {
  if (reqUserId) {
    return relations_.getUserFriendsAndCoGroupsMembers(reqUserId)
  } else {
    return []
  }
}

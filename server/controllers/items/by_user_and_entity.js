// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const items_ = __.require('controllers', 'items/lib/items')
const user_ = __.require('controllers', 'user/lib/user')
const promises_ = __.require('lib', 'promises')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  user: {},
  uri: {},
  limit: { optional: true },
  offset: { optional: true }
}

module.exports = (req, res) => sanitize(req, res, sanitization)
.then(params => {
  const { userId, uri, reqUserId } = params
  return user_.getUserById(userId, reqUserId)
  .then(getItemsFromUser(reqUserId, uri))
}).then(responses_.Send(res))
.catch(error_.Handler(req, res))

const getItemsFromUser = (reqUserId, uri) => user => {
  const { _id: ownerId } = user
  return getAuthorizationLevel(reqUserId, ownerId)
  .then(listingKey => items_.byOwnersAndEntitiesAndListings([ ownerId ], [ uri ], listingKey, reqUserId)
  .then(items => ({
    users: [ user ],
    items
  })))
}

const getAuthorizationLevel = (reqUserId, ownerId) => {
  if (reqUserId == null) return promises_.resolve('public')

  if (reqUserId === ownerId) return promises_.resolve('user')

  return user_.areFriendsOrGroupCoMembers(reqUserId, ownerId)
  .then(bool => { if (bool) { return 'network' } else { return 'public' } })
}

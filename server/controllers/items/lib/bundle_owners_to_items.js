// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')

module.exports = function(res, reqUserId, items){
  if ((items != null ? items.length : undefined) <= 0) throw error_.new('no item found', 404)
  const usersIds = getItemsOwners(items)
  return user_.getUsersByIds(usersIds, reqUserId)
  .then(users => res.json({ items, users }))
}

var getItemsOwners = function(items){
  const users = items.map(item => item.owner)
  return _.uniq(users)
}

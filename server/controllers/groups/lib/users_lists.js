// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const Group = __.require('models', 'group')

// Working around the circular dependency
let groups_ = null
const lateRequire = () => groups_ = require('./groups')
setTimeout(lateRequire, 0)

module.exports = {
  userInGroup(userId, groupId){
    return groups_.byId(groupId)
    .then(groups_.allGroupMembers)
    .then(userIdInUsers.bind(null, userId))
  },

  userInGroupOrOut(userId, groupId){
    return groups_.byId(groupId)
    .then(groups_.allGroupUsers)
    .then(userIdInUsers.bind(null, userId))
  },

  userInRequested(userId, groupId){
    return groups_.byId(groupId)
    .then(groups_.allRequested)
    .then(userIdInUsers.bind(null, userId))
  },

  userInAdmins(userId, groupId){
    return groups_.byId(groupId)
    .then(groups_.allAdmins)
    .then(userIdInUsers.bind(null, userId))
  },

  allGroupsMembers(groups){
    return _(groups).map(groups_.allGroupMembers).flatten().value()
  },

  allAdmins(group){
    return groups_.usersIdsByAgregatedCategories(group, [ 'admins' ])
  },

  allGroupMembers(group){
    return groups_.usersIdsByAgregatedCategories(group, Group.categories.members)
  },

  allGroupUsers(group){
    return groups_.usersIdsByAgregatedCategories(group, Group.categories.users)
  },

  allRequested(group){
    return groups_.usersIdsByAgregatedCategories(group, [ 'requested' ])
  },

  usersIdsByAgregatedCategories(group, categories){
    assert_.array(categories)
    return _(group).pick(categories).values().flatten()
    .map(_.property('user'))
    .value()
  }
}

var userIdInUsers = (userId, users) => users.includes(userId)

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const assert_ = __.require('utils', 'assert_types')
const Group = __.require('models', 'group')

// Working around the circular dependency
let groups_
const lateRequire = () => { groups_ = require('./groups') }
setTimeout(lateRequire, 0)

const lists_ = module.exports = {
  isMember: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(lists_.allGroupMembers)
    .then(userIdInUsers(userId))
  },

  isInGroup: (userId, groupId) => {
    return groups_.byId(groupId)
    // includes 'invited', 'requested'
    .then(lists_.allGroupUsers)
    .then(userIdInUsers(userId))
  },

  isInRequested: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(lists_.allRequested)
    .then(userIdInUsers(userId))
  },

  isAdmin: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(lists_.allAdmins)
    .then(userIdInUsers(userId))
  },

  allGroupsMembers: groups => {
    return _(groups)
    .map(lists_.allGroupMembers)
    .flatten()
    .value()
  },

  allAdmins: group => {
    return lists_.usersIdsByAgregatedCategories(group, [ 'admins' ])
  },

  allGroupMembers: group => {
    return lists_.usersIdsByAgregatedCategories(group, Group.categories.members)
  },

  allGroupUsers: group => {
    return lists_.usersIdsByAgregatedCategories(group, Group.categories.users)
  },

  allRequested: group => {
    return lists_.usersIdsByAgregatedCategories(group, [ 'requested' ])
  },

  usersIdsByAgregatedCategories: (group, categories) => {
    assert_.array(categories)
    return _(group)
    .pick(categories)
    .values()
    .flatten()
    .map(_.property('user'))
    .value()
  }
}

const userIdInUsers = userId => users => users.includes(userId)

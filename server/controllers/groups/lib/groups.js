// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let groups_
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const promises_ = __.require('lib', 'promises')
const Group = __.require('models', 'group')

const db = __.require('couch', 'base')('groups')

module.exports = (groups_ = {
  db,
  // using a view to avoid returning users or relations
  byId: db.viewFindOneByKey.bind(db, 'byId'),
  bySlug: db.viewFindOneByKey.bind(db, 'bySlug'),
  byUser: db.viewByKey.bind(db, 'byUser'),
  byInvitedUser: db.viewByKey.bind(db, 'byInvitedUser'),
  byAdmin: userId => {
    // could be simplified by making the byUser view
    // emit an arrey key with the role as second parameter
    // but it would make groups_.byUser more complex
    // (i.e. use a range instead of a simple key)
    return db.viewByKey('byUser', userId)
    .filter(Group.userIsAdmin.bind(null, userId))
  },

  // /!\ the 'byName' view does return groups with 'searchable' set to false
  nameStartBy: (name, limit = 10) => {
    name = name.toLowerCase()
    return db.viewCustom('byName', {
      startkey: name,
      endkey: `${name}Z`,
      include_docs: true,
      limit
    }
    )
  },

  // including invitations
  allUserGroups: userId => {
    return promises_.all([
      groups_.byUser(userId),
      groups_.byInvitedUser(userId)
    ])
    .spread(_.union.bind(_))
  },

  create: options => {
    return promises_.try(() => Group.create(options))
    .then(addSlug)
    .then(db.postAndReturn)
    .then(_.Log('group created'))
  },

  findUserGroupsCoMembers: userId => {
    return groups_.byUser(userId)
    .then(groups_.allGroupsMembers)
    // Deduplicate and remove the user own id from the list
    .then(usersIds => _.uniq(_.without(usersIds, userId)))
  },

  userInvited: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(_.partial(Group.findInvitation, userId, _, true))
  },

  byCreation: (limit = 10) => {
    return db.viewCustom('byCreation', { limit, descending: true, include_docs: true })
  }
})

groups_.byPosition = __.require('lib', 'by_position')(db, 'groups')

const membershipActions = require('./membership_actions')(db)
const usersLists = require('./users_lists')
const updateSettings = require('./update_settings')
const counts = require('./counts')
const leaveGroups = require('./leave_groups')
const getSlug = require('./get_slug')

const addSlug = group => getSlug(group.name, group._id)
.then(slug => {
  group.slug = slug
  return group
})

_.extend(groups_, membershipActions, usersLists, counts, leaveGroups, {
  updateSettings,
  getSlug,
  addSlug,
  getGroupData: require('./group_public_data')
})

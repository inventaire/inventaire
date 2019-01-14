const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const Group = __.require('models', 'group')
const db = __.require('couch', 'base')('groups')
const lists_ = require('./users_lists')
const { add: addSlug } = require('./slug')

const groups_ = module.exports = {
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
    })
  },

  // including invitations
  allUserGroups: userId => {
    return Promise.all([
      groups_.byUser(userId),
      groups_.byInvitedUser(userId)
    ])
    .spread(_.union.bind(_))
  },

  create: options => {
    return Promise.try(() => Group.create(options))
    .then(addSlug)
    .then(db.postAndReturn)
    .then(_.Log('group created'))
  },

  findUserGroupsCoMembers: userId => {
    return groups_.byUser(userId)
    .then(lists_.allGroupsMembers)
    // Deduplicate and remove the user own id from the list
    .then(usersIds => _.uniq(_.without(usersIds, userId)))
  },

  userInvited: (userId, groupId) => {
    return groups_.byId(groupId)
    .then(_.partial(Group.findInvitation, userId, _, true))
  },

  byCreation: (limit = 10) => {
    return db.viewCustom('byCreation', { limit, descending: true, include_docs: true })
  },

  getGroupMembersIds: groupId => {
    return groups_.byId(groupId)
    .then(group => {
      if (group == null) throw error_.notFound({ group: groupId })
      return Group.getAllMembers(group)
    })
  }
}

groups_.byPosition = __.require('lib', 'by_position')(db, 'groups')

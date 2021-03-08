const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const error_ = __.require('lib', 'error/error')
const Group = __.require('models', 'group')
const db = __.require('db', 'couchdb/base')('groups')
const lists_ = require('./users_lists')
const { add: addSlug } = require('./slug')
const searchGroupsByPosition = __.require('lib', 'search_by_position')(db, 'groups')

const groups_ = module.exports = {
  // using a view to avoid returning users or relations
  byId: db.viewFindOneByKey.bind(db, 'byId'),
  bySlug: db.viewFindOneByKey.bind(db, 'bySlug'),
  byUser: db.viewByKey.bind(db, 'byUser'),
  byInvitedUser: db.viewByKey.bind(db, 'byInvitedUser'),
  byAdmin: async userId => {
    // could be simplified by making the byUser view
    // emit an arrey key with the role as second parameter
    // but it would make groups_.byUser more complex
    // (i.e. use a range instead of a simple key)
    const groups = await db.viewByKey('byUser', userId)
    return groups.filter(group => Group.userIsAdmin(userId, group))
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
    .then(groups => _.union(...groups))
  },

  create: options => {
    return Promise.resolve()
    .then(() => Group.create(options))
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

  getGroupMembersIds: groupId => {
    return groups_.byId(groupId)
    .then(group => {
      if (group == null) throw error_.notFound({ group: groupId })
      return Group.getAllMembersIds(group)
    })
  },

  byPosition: searchGroupsByPosition
}

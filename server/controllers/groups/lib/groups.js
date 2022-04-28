const _ = require('builders/utils')
const error_ = require('lib/error/error')
const Group = require('models/group')
const db = require('db/couchdb/base')('groups')
const lists_ = require('./users_lists')
const { add: addSlug } = require('./slug')
const assert_ = require('lib/utils/assert_types')
const searchGroupsByPosition = require('lib/search_by_position')(db, 'groups')

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

  getUserGroupsIds: async userId => {
    const { rows } = await db.view('groups', 'byUser', {
      include_docs: false,
      key: userId,
    })
    return _.map(rows, 'id')
  },

  create: async options => {
    const group = Group.create(options)
    await addSlug(group)
    return db.postAndReturn(group).then(_.Log('group created'))
  },

  getUserGroupsCoMembers: async userId => {
    const groups = await groups_.byUser(userId)
    return getCoMembersIds(groups, userId)
  },

  getUserGroupsIdsAndCoMembersIds: async userId => {
    const groups = await groups_.byUser(userId)
    const coMembersIds = getCoMembersIds(groups, userId)
    const groupsIds = _.map(groups, '_id')
    return { groupsIds, coMembersIds }
  },

  userInvited: async (userId, groupId) => {
    const group = await groups_.byId(groupId)
    return Group.findInvitation(userId, group, true)
  },

  getGroupMembersIds: async groupId => {
    const group = await groups_.byId(groupId)
    if (group == null) throw error_.notFound({ group: groupId })
    return Group.getAllMembersIds(group)
  },

  byPosition: searchGroupsByPosition,

  imageIsUsed: async imageHash => {
    assert_.string(imageHash)
    const { rows } = await db.view('groups', 'byPicture', { key: imageHash })
    return rows.length > 0
  },
}

const getCoMembersIds = (groups, userId) => {
  const usersIds = lists_.allGroupsMembers(groups)
  // Deduplicate and remove the user own id from the list
  return _.uniq(_.without(usersIds, userId))
}

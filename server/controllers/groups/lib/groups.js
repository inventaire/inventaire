import _ from 'builders/utils'
import error_ from 'lib/error/error'
import Group from 'models/group'
import dbFactory from 'db/couchdb/base'
import lists_ from './users_lists'
import { add as addSlug } from './slug'
import assert_ from 'lib/utils/assert_types'
import searchGroupsByPositionFactory from 'lib/search_by_position'
const db = dbFactory('groups')
const searchGroupsByPosition = searchGroupsByPositionFactory(db, 'groups')

const groups_ = {
  // using a view to avoid returning users or relations
  byId: db.viewFindOneByKey.bind(db, 'byId'),
  byIds: db.byIds,
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
    assert_.string(userId)
    const { rows } = await db.view('groups', 'byUser', {
      include_docs: false,
      key: userId,
    })
    return _.map(rows, 'id')
  },

  getUsersGroupsIds: async usersIds => {
    assert_.strings(usersIds)
    const { rows } = await db.view('groups', 'byUser', {
      include_docs: false,
      keys: usersIds,
    })
    const groupsIdsByMembersIds = {}
    usersIds.forEach(userId => { groupsIdsByMembersIds[userId] = [] })
    rows.forEach(({ id: groupId, key: userId }) => groupsIdsByMembersIds[userId].push(groupId))
    return groupsIdsByMembersIds
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

export default groups_

const getCoMembersIds = (groups, userId) => {
  const usersIds = lists_.allGroupsMembers(groups)
  // Deduplicate and remove the user own id from the list
  return _.uniq(_.without(usersIds, userId))
}

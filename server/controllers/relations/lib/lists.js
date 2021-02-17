const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const couch_ = __.require('lib', 'couch')
const { minKey, maxKey } = couch_
const parseRelations = require('./parse_relations')
const groups_ = __.require('controllers', 'groups/lib/groups')
const db = __.require('couch', 'base')('users', 'relations')

const getAllUserRelations = (userId, includeDocs = false) => {
  return db.view('relations', 'byStatus', {
    startkey: [ userId, minKey ],
    endkey: [ userId, maxKey ],
    include_docs: includeDocs
  })
}

const lists = module.exports = {
  getUserRelations: userId => {
    return getAllUserRelations(userId)
    .then(parseRelations)
  },

  getUserFriends: userId => {
    const query = { key: [ userId, 'friends' ] }
    return db.view('relations', 'byStatus', query)
    .then(couch_.mapValue)
  },

  deleteUserRelations: userId => {
    return getAllUserRelations(userId, true)
    .then(couch_.mapDoc)
    .then(db.bulkDelete)
  },

  getUserFriendsAndCoGroupsMembers: async userId => {
    const [ friends, coMembers ] = await Promise.all([
      lists.getUserFriends(userId),
      groups_.findUserGroupsCoMembers(userId)
    ])
    return _.uniq(friends.concat(coMembers))
  }
}

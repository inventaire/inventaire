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
const couch_ = __.require('lib', 'couch')
const { minKey, maxKey } = couch_
const parseRelations = require('./parse_relations')
const groups_ = __.require('controllers', 'groups/lib/groups')
const { Promise } = __.require('lib', 'promises')

module.exports = db => {
  const getAllUserRelations = (userId, includeDocs = false) => db.view('relations', 'byStatus', {
    startkey: [ userId, minKey ],
    endkey: [ userId, maxKey ],
    include_docs: includeDocs
  }
  )

  const lists = {
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

    getUserFriendsAndCoGroupsMembers: userId => {
      return Promise.all([
        lists.getUserFriends(userId),
        groups_.findUserGroupsCoMembers(userId)
      ])
      .spread((friends, coMembers) => _.uniq(friends.concat(coMembers)))
    }
  }

  return lists
}

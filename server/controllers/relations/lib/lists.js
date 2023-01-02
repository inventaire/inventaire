import _ from '#builders/utils'
import couch_ from '#lib/couch'
import groups_ from '#controllers/groups/lib/groups'
import dbFactory from '#db/couchdb/base'
import parseRelations from './parse_relations.js'

const { minKey, maxKey } = couch_
const db = dbFactory('users', 'relations')

const getAllUserRelations = (userId, includeDocs = false) => {
  return db.view('relations', 'byStatus', {
    startkey: [ userId, minKey ],
    endkey: [ userId, maxKey ],
    include_docs: includeDocs
  })
}

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
      groups_.getUserGroupsCoMembers(userId)
    ])
    .then(([ friends, coMembers ]) => _.uniq(friends.concat(coMembers)))
  }
}
export default lists

const _ = require('builders/utils')
const Selection = require('models/selection')
const db = require('db/couchdb/base')('selections')
const error_ = require('lib/error/error')

const selections_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byEntities: async uris => db.viewByKeys('byEntities', uris),
  byLists: async listsIds => db.viewByKeys('byLists', listsIds),
  bulkDelete: db.bulkDelete,
  deleteListsSelections: async lists => {
    const listsSelections = lists.flatMap(list => list.selections)
    await selections_.bulkDelete(listsSelections)
  },
  create: async ({ list, uris, userId }) => {
    const listId = list._id
    if (list.creator !== userId) {
      throw error_.new('wrong user', 403, { userId, listId })
    }
    const selections = uris.map(uri => Selection.create({
      list: listId,
      uri,
    }))
    const res = await db.bulk(selections)
    const selectionsIds = _.map(res, 'id')
    return db.fetch(selectionsIds)
  },
}

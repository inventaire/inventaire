const _ = require('builders/utils')
const List = require('models/list')
const db = require('db/couchdb/base')('lists')
const { updatable: updateAttributes } = require('models/attributes/list')
const { validateVisibilityKeys } = require('controllers/shelves/lib/visibility')
const error_ = require('lib/error/error')
const entities_ = require('controllers/entities/lib/entities')

module.exports = {
  byId: db.get,
  byIds: db.byIds,
  create: async params => {
    const list = List.create(params)
    const invalidGroupId = await validateVisibilityKeys(list.visibility, list.user)
    if (invalidGroupId) {
      throw error_.new('list user is not in that group', 400, {
        visibilityKeys: list.visibility,
        groupId: invalidGroupId
      })
    }
    return db.postAndReturn(list)
  },
  updateAttributes: async params => {
    const { id, reqUserId } = params
    const newAttributes = _.pick(params, updateAttributes)
    if (newAttributes.visibility) {
      await validateVisibilityKeys(newAttributes.visibility, reqUserId)
    }
    const list = await db.get(id)
    const updatedList = List.updateAttributes(list, newAttributes, reqUserId)
    return db.putAndReturn(updatedList)
  },
  bulkDelete: db.bulkDelete,
  byUsers: ids => {
    return db.viewByKeys('byUser', ids)
  },
  deleteListsEntities: async lists => {
    const entitiesIds = _.uniq(_.map(lists, 'entities').flat())
    const docs = await entities_.byIds(entitiesIds).then(_.compact)
    await entities_.bulkDelete(docs)
    return docs
  },
  validateOwnership: (userId, lists) => {
    lists = _.forceArray(lists)
    for (const list of lists) {
      if (list.user !== userId) {
        throw error_.new('wrong user', 403, { userId, listId: list._id })
      }
    }
  },
}

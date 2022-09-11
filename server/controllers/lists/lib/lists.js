const _ = require('builders/utils')
const List = require('models/list')
const db = require('db/couchdb/base')('lists')
const { updatable: updateAttributes } = require('models/attributes/list')
const { validateVisibilityKeys } = require('lib/visibility/visibility')
const error_ = require('lib/error/error')
const selections_ = require('controllers/lists/lib/selections')
const { filterFoundSelectionsUris } = require('controllers/lists/lib/helpers')
const { tap } = require('lib/promises')
const getEntitiesByUris = require('controllers/entities/lib/get_entities_by_uris')

const lists_ = module.exports = {
  byId: db.get,
  byIds: db.byIds,
  byCreators: ids => db.viewByKeys('byCreator', ids),
  byIdsWithSelections: async (ids, userId) => {
    const lists = await lists_.byIds(ids)
    if (!_.isNonEmptyArray(lists)) return []
    const listIds = lists.map(_.property('_id'))
    const selections = await selections_.byLists(listIds, userId)
    if (!_.isNonEmptyArray(lists)) return []
    const selectionsByList = _.groupBy(selections, 'list')
    lists.forEach(assignSelectionsToList(selectionsByList))
    return lists
  },
  create: async params => {
    const list = List.create(params)
    const invalidGroupId = await validateVisibilityKeys(list.visibility, list.creator)
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
  addSelections: async ({ list, uris, userId }) => {
    const currentSelections = list.selections
    const { foundSelections, notFoundUris } = filterFoundSelectionsUris(currentSelections, uris)
    await validateExistingEntities(notFoundUris)
    await selections_.create({ uris: notFoundUris, list, userId })
    if (_.isNonEmptyArray(foundSelections)) {
      return { ok: true, alreadyInList: foundSelections }
    }
    return { ok: true }
  },
  validateOwnership: (userId, lists) => {
    lists = _.forceArray(lists)
    for (const list of lists) {
      if (list.creator !== userId) {
        throw error_.new('wrong user', 403, { userId, listId: list._id })
      }
    }
  },
  getListWithSelections: async (listId, userId) => {
    const lists = await lists_.byIdsWithSelections(listId, userId)
    return lists[0]
  },
  deleteUserListsAndSelections: userId => {
    return lists_.byCreators([ userId ])
    .then(tap(selections_.deleteListsSelections))
    .then(db.bulkDelete)
  },
}

const assignSelectionsToList = selectionsByList => list => {
  list.selections = selectionsByList[list._id] || []
}

const validateExistingEntities = async uris => {
  const { notFound } = await getEntitiesByUris({ uris })
  if (_.isNonEmptyArray(notFound)) {
    throw error_.new('entities not found', 403, { uris: notFound })
  }
}

const Shelf = require('models/shelf')
const db = require('db/couchdb/base')('shelves')
const { isVisibilityGroupKey } = require('lib/boolean_validations')
const { getUserGroupsIds } = require('controllers/groups/lib/groups')
const error_ = require('lib/error/error')

module.exports = async newShelf => {
  const shelf = Shelf.create(newShelf)
  if (hasGroupKeys(shelf.visibility)) {
    const userGroupsIds = await getUserGroupsIds(shelf.owner)
    validateGroupKeys(shelf, userGroupsIds)
  }
  return db.postAndReturn(shelf)
}

const hasGroupKeys = visibility => visibility.some(isVisibilityGroupKey)

const validateGroupKeys = (shelf, userGroupsIds) => {
  shelf.visibility
  .filter(isVisibilityGroupKey)
  .forEach(validateGroupKey(userGroupsIds, shelf))
}

const validateGroupKey = (userGroupsIds, shelf) => key => {
  const groupId = key.split(':')[1]
  if (!userGroupsIds.includes(groupId)) {
    throw error_.new('shelf owner is not in that group', 400, { shelf, groupId })
  }
}

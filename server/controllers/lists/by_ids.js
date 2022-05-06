const _ = require('builders/utils')
const { byIds } = require('controllers/lists/lib/lists')
const { addWarning } = require('lib/responses')
const filterVisibleDocs = require('lib/filter_visible_docs')
const error_ = require('lib/error/error')

const sanitization = {
  ids: {},
}

const controller = async ({ ids, reqUserId }, req, res) => {
  const foundLists = await byIds(ids, reqUserId)
  const foundListsIds = _.map(foundLists, '_id')
  checkNotFoundList(ids, foundLists, foundListsIds, res)
  const authorizedLists = await filterVisibleDocs(foundLists, reqUserId)
  checkUnauthorizedLists(ids, authorizedLists, foundListsIds, req, res)
  const lists = _.keyBy(authorizedLists, '_id')
  return { lists }
}

const checkNotFoundList = (ids, foundLists, foundListsIds, res) => {
  if (foundLists.length === 0) throw error_.notFound({ ids })
  if (foundLists.length !== ids.length) {
    const notFoundListsIds = _.difference(ids, foundListsIds)
    addWarning(res, `lists not found: ${notFoundListsIds.join(', ')}`)
  }
}

const checkUnauthorizedLists = (ids, authorizedLists, foundListsIds, req, res) => {
  if (authorizedLists.length === 0) {
    throw error_.unauthorized(req, 'unauthorized lists access', { ids: foundListsIds })
  }
  if (authorizedLists.length !== ids.length) {
    const authorizedListsIds = _.map(authorizedLists, '_id')
    const unauthorizedListsIds = _.difference(foundListsIds, authorizedListsIds)
    addWarning(res, `unauthorized lists access: ${unauthorizedListsIds.join(', ')}`)
  }
}

module.exports = { sanitization, controller }

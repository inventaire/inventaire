const _ = require('builders/utils')
const { byIds, byIdsWithItems } = require('controllers/shelves/lib/shelves')
const { addWarning } = require('lib/responses')
const filterVisibleDocs = require('lib/visibility/filter_visible_docs')
const error_ = require('lib/error/error')

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

const controller = async ({ ids, withItems, reqUserId }, req, res) => {
  const getShelves = withItems ? byIdsWithItems : byIds
  const foundShelves = await getShelves(ids, reqUserId)
  const foundShelvesIds = _.map(foundShelves, '_id')
  checkNotFoundShelves(ids, foundShelves, foundShelvesIds, res)
  const authorizedShelves = await filterVisibleDocs(foundShelves, reqUserId)
  checkUnauthorizedShelves(ids, authorizedShelves, foundShelvesIds, req, res)
  const shelves = _.keyBy(authorizedShelves, '_id')
  return { shelves }
}

const checkNotFoundShelves = (ids, foundShelves, foundShelvesIds, res) => {
  if (foundShelves.length === 0) throw error_.notFound({ ids })
  if (foundShelves.length !== ids.length) {
    const notFoundShelvesIds = _.difference(ids, foundShelvesIds)
    addWarning(res, `shelves not found: ${notFoundShelvesIds.join(', ')}`)
  }
}

const checkUnauthorizedShelves = (ids, authorizedShelves, foundShelvesIds, req, res) => {
  if (authorizedShelves.length === 0) {
    throw error_.unauthorized(req, 'unauthorized shelves access', { ids: foundShelvesIds })
  }
  if (authorizedShelves.length !== ids.length) {
    const authorizedShelvesIds = _.map(authorizedShelves, '_id')
    const unauthorizedShelvesIds = _.difference(foundShelvesIds, authorizedShelvesIds)
    addWarning(res, `unauthorized shelves access: ${unauthorizedShelvesIds.join(', ')}`)
  }
}

module.exports = { sanitization, controller }

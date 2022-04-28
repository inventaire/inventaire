const _ = require('builders/utils')
const { byIds, byIdsWithItems } = require('controllers/shelves/lib/shelves')
const filterVisibleShelves = require('./lib/filter_visible_shelves')

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

const controller = async params => {
  const shelves = await getShelvesByIds(params)
  return { shelves }
}

const getShelvesByIds = async ({ ids, withItems, reqUserId }) => {
  const getShelves = withItems ? byIdsWithItems : byIds
  const shelves = await getShelves(ids, reqUserId)
  // TODO: return a warning when some shelves can't be returned
  // an error when no shelf can be returned
  const authorizedShelves = await filterVisibleShelves(shelves, reqUserId)
  return _.keyBy(authorizedShelves, '_id')
}

module.exports = { sanitization, controller }

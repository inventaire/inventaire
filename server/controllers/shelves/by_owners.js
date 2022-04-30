const _ = require('builders/utils')
const shelves_ = require('controllers/shelves/lib/shelves')
const filterVisibleShelves = require('./lib/filter_visible_shelves')

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async params => {
  const { reqUserId, owners } = params
  const foundShelves = await shelves_.byOwners(owners)
  const authorizedShelves = await filterVisibleShelves(foundShelves, reqUserId)
  const shelves = _.keyBy(authorizedShelves, '_id')
  return { shelves }
}

module.exports = { sanitization, controller }

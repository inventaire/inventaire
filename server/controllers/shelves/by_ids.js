const _ = require('builders/utils')
const shelves_ = require('controllers/shelves/lib/shelves')
const filterVisibleShelves = require('./lib/filter_visible_shelves')
const { getNetworkUsersAndGroupsIds } = require('controllers/user/lib/relations_status')

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
  const byIdsFnName = withItems === true ? 'byIdsWithItems' : 'byIds'
  return Promise.all([
    shelves_[byIdsFnName](ids, reqUserId),
    getNetworkUsersAndGroupsIds(reqUserId),
  ])
  .then(filterVisibleShelves(reqUserId))
  .then(_.compact)
  .then(_.KeyBy('_id'))
}

module.exports = { sanitization, controller }

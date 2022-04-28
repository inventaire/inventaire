const _ = require('builders/utils')
const shelves_ = require('controllers/shelves/lib/shelves')
const filterVisibleShelves = require('./lib/filter_visible_shelves')
const { getNetworkUsersAndGroupsIds } = require('controllers/user/lib/relations_status')

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true }
}

const controller = async params => {
  const shelves = await getShelvesByOwners(params)
  return { shelves }
}

const getShelvesByOwners = async params => {
  const { reqUserId } = params
  let { owners } = params
  owners = _.forceArray(owners)
  return Promise.all([
    shelves_.byOwners(owners),
    getNetworkUsersAndGroupsIds(reqUserId),
  ])
  .then(filterVisibleShelves(reqUserId))
  .then(_.KeyBy('_id'))
}

module.exports = { sanitization, controller }

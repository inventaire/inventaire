const _ = require('builders/utils')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const shelves_ = require('controllers/shelves/lib/shelves')
const sanitize = require('lib/sanitize/sanitize')
const filterVisibleShelves = require('./lib/filter_visible_shelves')
const { getNetworkIds } = require('controllers/user/lib/relations_status')

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(getShelvesByIds)
  .then(responses_.Wrap(res, 'shelves'))
  .catch(error_.Handler(req, res))
}

const getShelvesByIds = async ({ ids, withItems, reqUserId }) => {
  const byIdsFnName = withItems === true ? 'byIdsWithItems' : 'byIds'
  return Promise.all([
    shelves_[byIdsFnName](ids, reqUserId),
    getNetworkIds(reqUserId)
  ])
  .then(filterVisibleShelves(reqUserId))
  .then(_.compact)
  .then(_.KeyBy('_id'))
}

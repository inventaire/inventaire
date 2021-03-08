const __ = require('config').universalPath
const _ = require('builders/utils')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const shelves_ = require('controllers/shelves/lib/shelves')
const sanitize = require('lib/sanitize/sanitize')
const filterVisibleShelves = require('./lib/filter_visible_shelves')
const { getNetworkIds } = require('controllers/user/lib/relations_status')

const sanitization = {
  owners: {},
  limit: { optional: true },
  offset: { optional: true }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { reqUserId } = params
    let { owners } = params
    owners = _.forceArray(owners)
    return Promise.all([ shelves_.byOwners(owners), getNetworkIds(reqUserId) ])
    .then(filterVisibleShelves(reqUserId))
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'shelves'))
  })
  .catch(error_.Handler(req, res))
}

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const sanitize = __.require('lib', 'sanitize/sanitize')
const filterVisibleShelves = require('./lib/filter_visible_shelves')
const { getNetworkIds } = __.require('controllers', 'user/lib/relations_status')

const sanitization = {
  ids: {},
  'with-items': {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res, next) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { ids, withItems, reqUserId } = params
    const byIdsFnName = withItems === true ? 'byIdsWithItems' : 'byIds'
    return Promise.all([ shelves_[byIdsFnName](ids, reqUserId), getNetworkIds(reqUserId) ])
    .then(filterVisibleShelves(reqUserId))
    .then(_.compact)
    .then(_.KeyBy('_id'))
    .then(responses_.Wrap(res, 'shelves'))
  })
  .catch(error_.Handler(req, res))
}

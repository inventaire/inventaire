const __ = require('config').universalPath
const { getUserRelations, getNetworkIds } = require('controllers/user/lib/relations_status')
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(() => {
    return Promise.all([
      getUserRelations(req.user._id),
      getNetworkIds(req.user._id)
    ])
  })
  .then(([ relations, networkIds ]) => {
    delete relations.none
    relations.network = networkIds
    return relations
  })
  .then(responses_.Send(res))
  .catch(error_.Handler(req, res))
}

const __ = require('config').universalPath
const { getUserRelations, getNetworkIds } = __.require('controllers', 'user/lib/relations_status')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Promise } = __.require('lib', 'promises')
const sanitize = __.require('lib', 'sanitize/sanitize')

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

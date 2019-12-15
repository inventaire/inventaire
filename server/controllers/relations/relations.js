const __ = require('config').universalPath
const { getUserRelations, getNetworkIds } = __.require('controllers', 'user/lib/relations_status')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Promise } = __.require('lib', 'promises')

module.exports = {
  get: (req, res) => {
    if (req.user == null) return error_.unauthorizedApiAccess(req, res)

    return Promise.all([
      getUserRelations(req.user._id),
      getNetworkIds(req.user._id)
    ])
    .spread((relations, networkIds) => {
      delete relations.none
      relations.network = networkIds
      return relations
    })
    .then(responses_.Send(res))
    .catch(error_.Handler(req, res))
  },

  post: require('./post')
}

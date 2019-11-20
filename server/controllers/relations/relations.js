
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const { Promise } = __.require('lib', 'promises')

module.exports = {
  get: (req, res) => {
    if (req.user == null) return error_.unauthorizedApiAccess(req, res)

    return Promise.all([
      user_.getUserRelations(req.user._id),
      user_.getNetworkIds(req.user._id)
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

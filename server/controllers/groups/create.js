

// Fix any style issues and re-enable lint.
const CONFIG = require('config')
const __ = CONFIG.universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const groups_ = require('./lib/groups')
const { Track } = __.require('lib', 'track')

module.exports = (req, res) => {
  let { name, searchable, description, position } = req.body
  if (name == null) return error_.bundleMissingBody(req, res, 'name')

  if (searchable == null) { searchable = true }

  return groups_.create({
    name,
    description: description || '',
    searchable,
    position: position || null,
    creatorId: req.user._id
  })
  .then(responses_.Send(res))
  .then(Track(req, [ 'groups', 'create' ]))
  .catch(error_.Handler(req, res))
}

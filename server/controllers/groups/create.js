const CONFIG = require('config')
const __ = CONFIG.universalPath
const responses_ = __.require('lib', 'responses')
const error_ = __.require('lib', 'error/error')
const groups_ = require('./lib/groups')
const { Track } = __.require('lib', 'track')
const sanitize = __.require('lib', 'sanitize/sanitize')

const sanitization = {
  name: {},
  description: { optional: true },
  position: { optional: true },
  searchable: {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { name, description, position } = params
    let { searchable } = params

    if (searchable == null) searchable = true

    return groups_.create({
      name,
      description: description || '',
      searchable,
      position: position || null,
      creatorId: req.user._id
    })
  })
  .then(responses_.Send(res))
  .then(Track(req, [ 'groups', 'create' ]))
  .catch(error_.Handler(req, res))
}

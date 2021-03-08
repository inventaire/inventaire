const CONFIG = require('config')
const __ = CONFIG.universalPath
const responses_ = require('lib/responses')
const error_ = require('lib/error/error')
const groups_ = require('./lib/groups')
const { Track } = require('lib/track')
const sanitize = require('lib/sanitize/sanitize')

const sanitization = {
  name: {},
  description: { optional: true },
  position: { optional: true },
  searchable: {
    optional: true,
    generic: 'boolean'
  },
  open: {
    optional: true,
    generic: 'boolean'
  }
}

module.exports = (req, res) => {
  sanitize(req, res, sanitization)
  .then(params => {
    const { name, description, position, open } = params
    let { searchable } = params

    if (searchable == null) searchable = true

    return groups_.create({
      name,
      description: description || '',
      searchable,
      position: position || null,
      creatorId: req.user._id,
      open: open || false
    })
  })
  .then(responses_.Send(res))
  .then(Track(req, [ 'groups', 'create' ]))
  .catch(error_.Handler(req, res))
}

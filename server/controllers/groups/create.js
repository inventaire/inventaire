const groups_ = require('./lib/groups')

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

const controller = async params => {
  const { name, description, position, open, reqUserId } = params
  let { searchable } = params

  if (searchable == null) searchable = true

  return groups_.create({
    name,
    description: description || '',
    searchable,
    position: position || null,
    creatorId: reqUserId,
    open: open || false
  })
}

module.exports = {
  sanitization,
  controller,
  track: [ 'groups', 'create' ]
}

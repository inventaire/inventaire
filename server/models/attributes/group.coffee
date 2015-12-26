module.exports = attributes = {}

# attributes that can be changed by an admin with a simple validity check
attributes.updatable = [
  'name'
  'picture'
  'description'
  'searchable'
  'position'
]


attributes.usersLists = [
  'admins'
  'members'
  'invited'
  'declined'
  'requested'
]

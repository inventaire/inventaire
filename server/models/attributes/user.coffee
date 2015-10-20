module.exports = attributes = {}

# attributes that can be send to the owner
attributes.ownerSafe = [
  '_id'
  '_rev'
  'username'
  'email'
  'picture'
  'language'
  'creationStrategy'
  'hasPassword'
  'validEmail'
  'bio'
  'settings'
  'position'
]

attributes.public = [
  '_id'
  'username'
  'picture'
  'bio'
  'position'
]

# attributes that need availability check before update
attributes.concurrencial = [
  'username'
  'email'
]

# attributes that can be changed with a simple validity check
attributes.updatable = [
  'picture'
  'language'
  'bio'
  'settings'
  'position'
]

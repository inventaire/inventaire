// Attributes that can be changed by an admin with a simple validity check
export const updatable = [
  'name',
  'picture',
  'description',
  'searchable',
  'position',
  'open',
]

export const usersLists = [
  'admins',
  'members',
  'invited',
  'declined',
  'requested',
]

export const acceptNullValue = [
  'position',
  'picture',
]

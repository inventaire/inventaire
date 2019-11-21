const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')

// MUST return the item or throw an error
exports.verifyRightToInteract = (userId, item, ownerAllowed) => {
  const { owner, listing } = item

  // item owner right to interact depends on the interaction
  // ex: comment-> allowed, request-> not allowed
  if (owner === userId) {
    if (ownerAllowed) return item
    else forbidden(userId, item)
  }

  // Anyone can interact on a public item
  if (listing === 'public') return item
  // Network users only can interact on a network item
  else if (listing === 'network') return ifUserAreFriendsOrGroup(userId, owner, item)
  // Last case: listing === 'private'
  // No one can interact on a private item
  else return forbidden(userId, item)
}

const ifUserAreFriendsOrGroup = (userId, owner, item) => {
  user_.areFriendsOrGroupCoMembers(userId, owner)
  .then(bool => {
    if (bool) return item
    else return forbidden(userId, item)
  })
}

const forbidden = (userId, item) => {
  throw error_.new('not allowed with this item', 403, userId, item)
}

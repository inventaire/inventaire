const __ = require('config').universalPath
const user_ = __.require('controllers', 'user/lib/user')
const error_ = __.require('lib', 'error/error')

// MUST return the item or throw an error
exports.verifyRightToInteract = (userId, item, ownerAllowed) => {
  const { owner, listing } = item

  // item owner right to interact depends on the interaction
  // ex: comment-> allowed, request-> not allowed
  if (owner === userId) {
    if (ownerAllowed) {
      return item
    } else {
      forbidden(userId, item)
    }
  }

  switch (listing) {
  // anyone can interact on a public item
  case 'public': return item
    // network users only can interact on a network item
  case 'network': return ifUserAreFriendsOrGroup(userId, owner, item)
    // no one can interact on a private item
  case 'private': return forbidden(userId, item)
  }
}

const ifUserAreFriendsOrGroup = (userId, owner, item) => user_.areFriendsOrGroupCoMembers(userId, owner)
.then(bool => {
  if (bool) {
    return item
  } else {
    return forbidden(userId, item)
  }
})

const forbidden = (userId, item) => {
  throw error_.new('not allowed with this item', 403, userId, item)
}

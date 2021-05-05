// SPDX-FileCopyrightText:  2014  Maxime Lathuilière, Vincent Jumeaux
// SPDX-License-Identifier: AGPL-3.0-only

const { areFriendsOrGroupCoMembers } = require('controllers/user/lib/relations_status')
const error_ = require('lib/error/error')

// MUST return the item or throw an error
module.exports = {
  verifyRightToInteract: (userId, item, ownerAllowed) => {
    const { owner, listing } = item

    // item owner right to interact depends on the interaction
    // ex: comment-> allowed, request-> not allowed
    if (owner === userId) {
      if (ownerAllowed) return item
      else throw forbidden(userId, item)
    }

    // Anyone can interact on a public item
    if (listing === 'public') return item
    // Network users only can interact on a network item
    else if (listing === 'network') return ifUserAreFriendsOrGroup(userId, owner, item)
    // Last case: listing === 'private'
    // No one can interact on a private item
    else throw forbidden(userId, item)
  }
}

const ifUserAreFriendsOrGroup = (userId, owner, item) => {
  return areFriendsOrGroupCoMembers(userId, owner)
  .then(bool => {
    if (bool) return item
    else throw forbidden(userId, item)
  })
}

const forbidden = (userId, item) => {
  return error_.new('not allowed with this item', 403, userId, item)
}

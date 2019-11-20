
module.exports = (userId, otherId, status) => {
  switch (status) {
  case 'friends': return 'friends'
  case 'a-requested':
    if (userId < otherId) {
      return 'userRequested'
    } else {
      return 'otherRequested'
    }
  case 'b-requested':
    if (userId < otherId) {
      return 'otherRequested'
    } else {
      return 'userRequested'
    }
  default: return 'none'
  }
}

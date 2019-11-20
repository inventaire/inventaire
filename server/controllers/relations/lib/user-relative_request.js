module.exports = (userId, otherId, status) => {
  if (status === 'friends') return 'friends'
  else if (status === 'a-requested') return userId < otherId ? 'userRequested' : 'otherRequested'
  else if (status === 'b-requested') return userId < otherId ? 'otherRequested' : 'userRequested'
  else return 'none'
}

const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const { getUserRelations } = __.require('controllers', 'user/lib/relations_status')
const shelves_ = __.require('controllers', 'shelves/lib/shelves')
const groups_ = __.require('controllers', 'groups/lib/groups')
const transactions_ = __.require('controllers', 'transactions/lib/transactions')
const { getUserTotalContributions } = __.require('controllers', 'entities/lib/patches')
const { oneDay } = __.require('lib', 'time')

module.exports = async userId => {
  const [
    user,
    relations,
    shelves,
    transactions,
    groups,
    groupsInvitations,
    contributions,
  ] = await Promise.all([
    user_.byId(userId),
    getUserRelations(userId),
    shelves_.byOwners([ userId ]),
    transactions_.byUser(userId),
    groups_.byUser(userId),
    groups_.byInvitedUser(userId),
    getUserTotalContributions(userId),
  ])

  const { _id, username, bio, created, roles, snapshot } = user

  relations.friends = relations.friends.length
  relations.userRequested = relations.userRequested.length
  relations.otherRequested = relations.otherRequested.length
  relations.none = relations.none.length

  const itemsCount = _.sum(_.map(Object.values(snapshot), 'items:count'))

  const total = _.sum([
    itemsCount,
    shelves.length,
    transactions.length,
    relations.friends,
    relations.userRequested,
    relations.otherRequested,
    relations.none,
    groups.length,
    groupsInvitations.length,
    contributions,
  ])

  return {
    _id,
    username,
    bio,
    created: new Date(created).toISOString(),
    days: Math.round((Date.now() - created) / oneDay),
    roles,
    total,
    items: itemsCount,
    shelves: shelves.length,
    transactions: transactions.length,
    relations,
    groups: {
      member: groups.length,
      invited: groupsInvitations.length,
    },
    contributions
  }
}

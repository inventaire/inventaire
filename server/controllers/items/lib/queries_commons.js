/* eslint-disable
    prefer-const,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let queriesCommons
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const user_ = __.require('controllers', 'user/lib/user')
const promises_ = __.require('lib', 'promises')
const error_ = __.require('lib', 'error/error')
const snapshot_ = require('./snapshot/snapshot')

const filters =
  // Prevent showing private items in group context to avoid giving the false
  // impresssion that those are visible by other members of the group
  { group(item){ return item.listing !== 'private' } }

const validFilters = Object.keys(filters)

module.exports = (queriesCommons = {
  validFilters,

  addAssociatedData(page){
    return Promise.all([
      queriesCommons.addItemsSnapshots(page.items),
      queriesCommons.addUsersData(page)
    ])
    .then(() => page)
  },

  addUsersData(page){
    const { reqUserId, includeUsers } = page
    if (includeUsers === false) { return page }

    const { items } = page
    if (items.length === 0) {
      page.users = []
      return page
    }

    const ownersIds = _.uniq(items.map(_.property('owner')))

    return user_.getUsersByIds(ownersIds, reqUserId)
    .then((users) => {
      page.users = users
      return page
    })
  },

  addItemsSnapshots(items){
    return Promise.all(items.map(snapshot_.addToItem))
  },

  ownerIs(userId){ return item => item.owner === userId },

  listingIs(listing){ return item => item.listing === listing },

  Paginate(page){ return function(items){
    let { limit, offset, filter } = page
    items = items.sort(byCreationDate)
    if (filter != null) { items = items.filter(filters[filter]) }
    const total = items.length
    if (offset == null) { offset = 0 }
    const last = offset + limit
    if (limit != null) {
      items = items.slice(offset, last)
      const data = { items, total, offset, filter }
      if (last < total) { data.continue = last }
      return data
    } else {
      return { items, total, offset, filter }
    }
  } }
})

var byCreationDate = (a, b) => b.created - a.created

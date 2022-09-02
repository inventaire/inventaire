const _ = require('builders/utils')
const user_ = require('controllers/user/lib/user')
const { setItemsBusyFlag } = require('controllers/transactions/lib/transactions')
const snapshot_ = require('./snapshot/snapshot')

const filters = {
  // Prevent showing private items in group context to avoid giving the false
  // impression that those are visible by other members of the group
  group: item => item.visibility.length > 0
}

const validFilters = Object.keys(filters)

const addUsersData = async (page, reqParams) => {
  const { reqUserId, includeUsers } = reqParams
  if (includeUsers === false) return page

  const { items } = page
  if (items.length === 0) {
    page.users = []
    return page
  }

  const ownersIds = _.uniq(items.map(_.property('owner')))

  const users = await user_.getUsersByIds(ownersIds, reqUserId)
  page.users = users
  return page
}

const addItemsSnapshots = items => {
  return Promise.all(items.map(snapshot_.addToItem))
}

module.exports = {
  validFilters,
  addItemsSnapshots,

  addAssociatedData: async (page, reqParams) => {
    await Promise.all([
      addItemsSnapshots(page.items),
      addUsersData(page, reqParams),
      setItemsBusyFlag(page.items),
    ])
    return page
  },

  paginate: (items, params) => {
    let { limit, offset, filter } = params
    items = items.sort(byCreationDate)
    if (filter != null) items = items.filter(filters[filter])
    const total = items.length
    if (offset == null) offset = 0
    const last = offset + limit

    if (limit != null) {
      items = items.slice(offset, last)
      const data = { items, total, offset, filter }
      if (last < total) data.continue = last
      return data
    } else {
      return { items, total, offset, filter }
    }
  }
}

const byCreationDate = (a, b) => b.created - a.created

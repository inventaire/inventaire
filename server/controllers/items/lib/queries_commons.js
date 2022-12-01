const _ = require('builders/utils')
const user_ = require('controllers/user/lib/user')
const { setItemsBusyFlag } = require('controllers/transactions/lib/transactions')
const snapshot_ = require('./snapshot/snapshot')
const { isVisibilityGroupKey } = require('lib/boolean_validations')

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
    let { limit, offset, context } = params
    items = items.sort(byCreationDate)
    if (context != null) {
      items = items.filter(canBeDisplayedInContext(context))
    }
    const total = items.length
    if (offset == null) offset = 0
    const last = offset + limit

    if (limit != null) {
      items = items.slice(offset, last)
      const data = { items, total, offset, context }
      if (last < total) data.continue = last
      return data
    } else {
      return { items, total, offset, context }
    }
  }
}

const byCreationDate = (a, b) => b.created - a.created

const canBeDisplayedInContext = context => item => {
  if (isVisibilityGroupKey(context)) {
    const { visibility } = item
    if (visibility.includes('public') || visibility.includes('groups') || visibility.includes(context)) {
      return true
    } else {
      return false
    }
  } else {
    return true
  }
}

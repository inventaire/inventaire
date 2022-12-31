import _ from 'builders/utils'
import user_ from 'controllers/user/lib/user'
import { setItemsBusyFlag } from 'controllers/transactions/lib/transactions'
import snapshot_ from './snapshot/snapshot'
import { isVisibilityGroupKey } from 'lib/boolean_validations'

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

export default {
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

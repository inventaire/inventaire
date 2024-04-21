import { partition } from 'lodash-es'
import { getItemsByIds, itemsBulkUpdate } from '#controllers/items/lib/items'
import { validateShelves } from '#controllers/items/lib/validate_item_async'
import { emit } from '#lib/radio'
import { warn } from '#lib/utils/logs'
import { validateVisibilityKeys } from '#lib/visibility/visibility'
import { updateItemDoc } from '#models/item'

export async function bulkItemsUpdate ({ reqUserId, ids, attribute, value, attempt = 0, previousUpdates = [] }) {
  const itemUpdateData = { [attribute]: value }
  const currentItems = await getItemsByIds(ids)
  const formattedItems = currentItems.map(currentItem => updateItemDoc(reqUserId, itemUpdateData, currentItem))
  await validateValue({ attribute, value, reqUserId })
  try {
    const successfulUpdates = await itemsBulkUpdate(formattedItems)
    await emit('user:inventory:update', reqUserId)
    return previousUpdates.concat(successfulUpdates)
  } catch (err) {
    if (attempt > 10) throw err
    const { body } = err.context
    const [ failedUpdates, successfulUpdates ] = partition(body, hasError)
    warn({ failedUpdates, successfulUpdates, attempt }, 'retrying bulk items update')
    return bulkItemsUpdate({
      reqUserId,
      ids: failedUpdates.map(getId),
      attribute,
      value,
      attempt: ++attempt,
      previousUpdates: previousUpdates.concat(successfulUpdates),
    })
  }
}

const hasError = ({ error }) => error != null
const getId = ({ id }) => id

async function validateValue ({ attribute, value, reqUserId }) {
  if (attribute === 'visibility') {
    await validateVisibilityKeys(value, reqUserId)
  } else if (attribute === 'shelves') {
    await validateShelves(reqUserId, value)
  }
}

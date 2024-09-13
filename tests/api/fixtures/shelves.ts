import { map } from 'lodash-es'
import { randomWords } from '#fixtures/text'
import { customAuthReq } from '#tests/api/utils/request'
import { addItemsToShelf } from '#tests/api/utils/shelves'
import { getUser } from '#tests/api/utils/utils'
import { createItem } from './items.js'

export const shelfName = () => randomWords(3, ' shelf')
export const shelfDescription = () => {
  return randomWords(3, ' shelf')
}

export const createShelf = async (userPromise, shelfData = {}) => {
  userPromise = userPromise || getUser()
  shelfData.name = shelfData.name || shelfName()
  shelfData.visibility = shelfData.visibility || [ 'public' ]
  shelfData.color = shelfData.color || '#222222'
  shelfData.description = shelfData.description || shelfDescription()
  const user = await userPromise
  const endpoint = '/api/shelves?action=create'
  const { shelf } = await customAuthReq(user, 'post', endpoint, shelfData)
  return { shelf, user }
}

export const createShelfWithItem = async (shelfData = {}, itemData, userPromise) => {
  userPromise = userPromise || getUser()
  const { shelf, user } = await createShelf(userPromise, shelfData)
  let item
  if (itemData?._id) {
    item = itemData
  } else {
    item = await createItem(user, itemData)
  }
  const itemId = item._id
  await addItemsToShelf(user, shelf, [ itemId ])
  return { shelf, item, user }
}

export const createShelfWithItems = async (shelfData = {}, items) => {
  items = await Promise.all(items.map(item => item || createItem()))
  const itemsIds = map(items, '_id')
  const { shelf } = await createShelf(null, shelfData)
  await addItemsToShelf(null, shelf, itemsIds)
  return { shelf, items }
}

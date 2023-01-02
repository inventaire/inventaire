import _ from '#builders/utils'
import { customAuthReq } from '../utils/request.js'
import { getUser } from '../utils/utils.js'
import { createItem } from '../fixtures/items.js'
import { addItemsToShelf } from '../utils/shelves.js'
import fakeText from './text.js'

const fixtures = {
  shelfName: () => fakeText.randomWords(3, ' shelf'),
  shelfDescription: () => {
    return fakeText.randomWords(3, ' shelf')
  },

  createShelf: async (userPromise, shelfData = {}) => {
    userPromise = userPromise || getUser()
    shelfData.name = shelfData.name || fixtures.shelfName()
    shelfData.visibility = shelfData.visibility || [ 'public' ]
    shelfData.color = shelfData.color || '#222222'
    shelfData.description = shelfData.description || fixtures.shelfDescription()
    const user = await userPromise
    const endpoint = '/api/shelves?action=create'
    const { shelf } = await customAuthReq(user, 'post', endpoint, shelfData)
    return { shelf, user }
  },

  createShelfWithItem: async (shelfData = {}, itemData, userPromise) => {
    userPromise = userPromise || getUser()
    const { shelf, user } = await fixtures.createShelf(userPromise, shelfData)
    let item
    if (itemData?._id) {
      item = itemData
    } else {
      item = await createItem(user, itemData)
    }
    const itemId = item._id
    await addItemsToShelf(user, shelf, [ itemId ])
    return { shelf, item, user }
  },

  createShelfWithItems: async (shelfData = {}, items) => {
    items = await Promise.all(items.map(item => item || createItem()))
    const itemsIds = _.map(items, '_id')
    const { shelf } = await fixtures.createShelf(null, shelfData)
    await addItemsToShelf(null, shelf, itemsIds)
    return { shelf, items }
  }
}
export default fixtures

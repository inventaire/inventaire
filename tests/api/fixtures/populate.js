import _ from '#builders/utils'
import { createUser } from '#fixtures/users'
import { importSomeImage } from '../utils/images.js'
import { updateUser } from '../utils/users.js'
import { createRandomizedItems } from './items.js'

let populatePromise
const usersCount = 2
const publicItemsPerUser = 4

export const populate = () => {
  if (populatePromise) return populatePromise
  populatePromise = Promise.all(_.times(usersCount, createUserWithItems))
  return populatePromise
}

export const createUserWithItems = async (userData, itemsData = [], withPicture) => {
  let user = userData
  if (!userData._id) user = await createUser(userData)
  if (withPicture) {
    await addPicture(user)
  }
  itemsData = _.times(publicItemsPerUser, i => itemsData[i] || {})
  const items = await createRandomizedItems(user, itemsData)
  return { user, items }
}

const addPicture = async user => {
  const { url } = await importSomeImage({ container: 'users' })
  await updateUser({
    user,
    attribute: 'picture',
    value: url,
  })
}

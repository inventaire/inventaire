import _ from '#builders/utils'
import { createRandomizedItems } from './items.js'
import { createUser } from './users.js'
import{ updateUser }from 'tests/api/utils/users'
import{ importSomeImage }from 'tests/api/utils/images'

let populatePromise
const usersCount = 2
const publicItemsPerUser = 4

export const populate = () => {
  if (populatePromise) return populatePromise
  populatePromise = Promise.all(_.times(usersCount, createUserWithItems))
  return populatePromise
}

export const createUserWithItems = async (userData, itemsData = []) => {
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
    value: url
  })
}

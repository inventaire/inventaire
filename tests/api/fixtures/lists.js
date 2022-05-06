const fakeText = require('./text')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')

const endpoint = '/api/lists?action='

const fixtures = module.exports = {
  listName: () => fakeText.randomWords(3, ' list'),
  listDescription: () => {
    return fakeText.randomWords(3, ' list')
  },

  createList: async (userPromise, listData = {}) => {
    userPromise = userPromise || getUser()
    listData.name = listData.name || fixtures.listName()
    listData.visibility = listData.visibility || [ 'public' ]
    listData.description = listData.description || fixtures.listDescription()
    const user = await userPromise
    const { list } = await customAuthReq(user, 'post', `${endpoint}create`, listData)
    return { list, user }
  }
}

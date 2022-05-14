const fakeText = require('./text')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition } = require('./entities')

const endpoint = '/api/lists?action='
const selections_ = require('controllers/lists/lib/selections')

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
  },

  createSelection: async ({ visibility = [ 'public' ] }, userPromise) => {
    const selectionData = {}

    const { list } = await fixtures.createList(userPromise, { visibility })
    selectionData.list = list

    const { uri } = await createEdition()
    selectionData.uris = [ uri ]

    userPromise = userPromise || getUser()
    const user = await userPromise
    selectionData.userId = user._id

    const selections = await selections_.create(selectionData)
    return {
      selection: selections[0],
      list,
      uri
    }
  }
}

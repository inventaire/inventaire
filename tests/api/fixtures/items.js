const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition, createEditionWithWorkAndAuthor, createEditionWithWorkAuthorAndSerie } = require('./entities')
const faker = require('faker')

const urisPromises = {}
const getEditionUriPromise = lang => {
  if (!urisPromises[lang]) {
    urisPromises[lang] = createEdition({ lang }).then(({ uri }) => uri)
  }
  return urisPromises[lang]
}

let count = 0
const getSharedEditionUri = () => {
  // Get 4/5 'en' editions, 1/5 'de' editions
  const lang = (count % 4) === 0 ? 'de' : 'en'
  count += 1
  return getEditionUriPromise(lang)
}

const listings = [ 'private', 'network', 'public' ]
const transactions = [ 'giving', 'lending', 'selling', 'inventorying' ]

const API = module.exports = {
  createItems: async (user, itemsData = []) => {
    user = user || getUser()
    const entity = itemsData[0] && itemsData[0].entity
    const entityUriPromise = entity ? Promise.resolve(entity) : getSharedEditionUri()
    const entityUri = await entityUriPromise
    const items = itemsData.map(addDefaultEntity(entityUri))
    return customAuthReq(user, 'post', '/api/items', items)
  },

  createItem: async (user, itemData = {}) => {
    itemData.listing = itemData.listing || 'public'
    const [ item ] = await API.createItems(user, [ itemData ])
    return item
  },

  createItemWithReservedWork: async user => {
    const { uri: entity } = await createEdition()
    return API.createItem(user, { entity })
  },

  createItemWithAuthor: async user => {
    const { uri: entity } = await createEditionWithWorkAndAuthor()
    return API.createItem(user, { entity })
  },

  createItemWithAuthorAndSerie: async user => {
    const { uri: entity } = await createEditionWithWorkAuthorAndSerie()
    return API.createItem(user, { entity })
  },

  createEditionAndItem: async (user, itemData = {}) => {
    const { uri } = await createEdition()
    itemData.entity = uri
    return API.createItem(user, itemData)
  },

  createRandomizedItems: (user, itemsData) => {
    return API.createItems(user, itemsData.map(randomizedItem))
  }
}

const randomizedItem = itemData => {
  itemData.listing = itemData.listing || _.sample(listings)
  itemData.transaction = itemData.transaction || _.sample(transactions)
  itemData.details = faker.hacker.phrase()
  itemData.notes = faker.lorem.paragraph()
  return itemData
}

const addDefaultEntity = entityUri => item => {
  if (!item.entity) item.entity = entityUri
  return item
}

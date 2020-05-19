const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition, createEditionWithWorkAndAuthor, createEditionWithWorkAuthorAndSerie } = require('./entities')
const faker = require('faker')

const getEditionUri = async (lang = 'en') => {
  const { uri } = await createEdition({ lang })
  return uri
}

const API = module.exports = {
  createItems: async (user, itemsData = []) => {
    user = user || getUser()
    const items = await Promise.all(itemsData.map(addDefaultEntity))
    return customAuthReq(user, 'post', '/api/items', items)
  },

  createItem: async (user, itemData = {}) => {
    user = user || getUser()
    itemData.listing = itemData.listing || 'public'
    await addDefaultEntity(itemData)
    const [ item ] = await customAuthReq(user, 'post', '/api/items', [ itemData ])
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
    return API.createItems(user, itemsData.map(fillItemWithRandomData))
  }
}

const transactions = [ 'giving', 'lending', 'selling', 'inventorying' ]
const listings = [ 'private', 'network', 'public' ]

const fillItemWithRandomData = (itemData = {}) => {
  itemData.listing = itemData.listing || _.sample(listings)
  itemData.transaction = itemData.transaction || _.sample(transactions)
  itemData.details = faker.hacker.phrase()
  itemData.notes = faker.lorem.paragraph()
  return itemData
}

const addDefaultEntity = async itemData => {
  if (!itemData.entity) {
    const entity = itemData[0] && itemData[0].entity
    const entityUri = await (entity || getEditionUri())
    itemData.entity = entityUri
  }
  return itemData
}

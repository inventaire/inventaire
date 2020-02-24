const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { Promise } = __.require('lib', 'promises')
const { customAuthReq } = require('../utils/request')
const { getUser } = require('../utils/utils')
const { createEdition } = require('./entities')
const faker = require('faker')

const urisPromises = {}
const getEditionUriPromise = lang => {
  if (!urisPromises[lang]) {
    urisPromises[lang] = createEdition({ lang }).then(({ uri }) => uri)
  }
  return urisPromises[lang]
}

let count = 0
const getEditionUri = () => {
  // Get 4/5 'en' editions, 1/5 'de' editions
  const lang = (count % 4) === 0 ? 'de' : 'en'
  count += 1
  return getEditionUriPromise(lang)
}

const listings = [ 'private', 'network', 'public' ]
const transactions = [ 'giving', 'lending', 'selling', 'inventorying' ]

const API = module.exports = {
  createItems: (user, itemsData = []) => {
    user = user || getUser()
    const entity = itemsData[0] && itemsData[0].entity
    const entityUriPromise = entity ? Promise.resolve(entity) : getEditionUri()
    return entityUriPromise
    .then(entityUri => {
      const items = itemsData.map(addDefaultEntity(entityUri))
      return customAuthReq(user, 'post', '/api/items', items)
    })
  },

  createItem: (user, itemData = {}) => {
    if (!itemData.listing) itemData.listing = 'public'
    return API.createItems(user, [ itemData ])
    .then(([ item ]) => item)
  },

  createEditionAndItem: (user, itemData = {}) => {
    return createEdition()
    .then(edition => API.createItem(user, { entity: `inv:${edition._id}` }))
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

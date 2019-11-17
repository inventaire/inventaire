// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let API
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
  if (!urisPromises[lang]) { urisPromises[lang] = createEdition({ lang }).get('uri') }
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

module.exports = (API = {
  createItems: (userPromise, itemsData = []) => {
    if (!userPromise) { userPromise = getUser() }
    const entity = (itemsData[0] != null) ? itemsData[0].entity : undefined
    const entityUriPromise = entity ? Promise.resolve(entity) : getEditionUri()

    return entityUriPromise
    .then(entityUri => {
      const items = itemsData.map(addDefaultEntity(entityUri))
      return customAuthReq(userPromise, 'post', '/api/items', items)
    })
  },

  createItem: (userPromise, itemData = {}) => {
    if (!itemData.listing) { itemData.listing = 'public' }
    return API.createItems(userPromise, [ itemData ])
    .get('0')
  },

  createEditionAndItem: (userPromise, itemData = {}) => {
    return createEdition()
    .then(edition => API.createItem(userPromise, { entity: `inv:${edition._id}` }))
  },

  createRandomizedItems: (userPromise, itemsData) => {
    return API.createItems(userPromise, itemsData.map(randomizedItem))
  }
})

const randomizedItem = itemData => {
  const { entity, listing, transaction } = itemData
  if (!itemData.listing) { itemData.listing = _.sample(listings) }
  if (!itemData.transaction) { itemData.transaction = _.sample(transactions) }
  itemData.details = faker.hacker.phrase()
  itemData.notes = faker.lorem.paragraph()
  return itemData
}

const addDefaultEntity = entityUri => item => {
  if (!item.entity) { item.entity = entityUri }
  return item
}

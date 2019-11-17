// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { Promise } = __.require('lib', 'promises')
const { getUser, getUserB, authReq } = __.require('apiTests', 'utils/utils')
const { createItem } = require('./items')
const { addAuthor } = require('./entities')
const { getByUri: getEntityByUri } = require('../utils/entities')
const { getById: getRefreshedItem } = require('../utils/items')

module.exports = {
  createTransaction: () => {
    return createItem(getUserB(), { listing: 'public', transaction: 'giving' })
    .tap(addAuthorToItemEditionWork)
    .then(getRefreshedItem)
    .then(userBItem => Promise.all([
      getUser(),
      getUserB()
    ])
    .spread((userA, userB) => authReq('post', '/api/transactions?action=request', {
      item: userBItem._id,
      message: 'yo'
    })
    .then(res => {
      _.extend(res, { userA, userB, userBItem })
      return res
    })))
  },

  addMessage: transaction => {
    return authReq('post', '/api/transactions?action=message', {
      action: 'message',
      transaction: transaction._id,
      message: 'yo'
    }
    )
  }
}

const addAuthorToItemEditionWork = item => getEntityByUri(item.entity)
.then(edition => {
  const workUri = edition.claims['wdt:P629'][0]
  return addAuthor(workUri)
}).delay(1000)

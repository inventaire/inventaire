require('should')
const { getUser } = require('../utils/utils')
const { rawRequest } = require('../utils/request')
const { createItem } = require('../fixtures/items')

describe('feeds:get', () => {
  it('should return a user RSS feed', async () => {
    const user = await getUser()
    const userId = user._id
    const { body } = await rawRequest('get', `/api/feeds?user=${userId}`)
    body.startsWith('<?xml').should.be.true()
  })

  it('should return a user RSS feed when the user has an item', async () => {
    const userPromise = getUser()
    const itemPromise = createItem(userPromise)

    const [ user, item ] = await Promise.all([
      userPromise,
      itemPromise
    ])
    const userId = user._id
    const { body } = await rawRequest('get', `/api/feeds?user=${userId}`)
    body.includes(item._id).should.be.true()
  })

  it('should not return private items when not authorized', async () => {
    const userPromise = getUser()
    const itemAPromise = createItem(userPromise, { listing: 'private' })
    const itemBPromise = createItem(userPromise, { listing: 'network' })

    const [ user, itemA, itemB ] = await Promise.all([
      userPromise,
      itemAPromise,
      itemBPromise
    ])
    const userId = user._id
    const { body } = await rawRequest('get', `/api/feeds?user=${userId}`)
    body.startsWith('<?xml').should.be.true()
    body.includes(itemA._id).should.be.false()
    body.includes(itemB._id).should.be.false()
  })

  it('should return private items when authorized', async () => {
    const userPromise = getUser()
    const itemAPromise = createItem(userPromise, { listing: 'private' })
    const itemBPromise = createItem(userPromise, { listing: 'network' })

    const [ user, itemA, itemB ] = await Promise.all([
      userPromise,
      itemAPromise,
      itemBPromise
    ])
    const { _id: userId, readToken: token } = user
    const { body } = await rawRequest('get', `/api/feeds?user=${userId}&requester=${userId}&token=${token}`)
    body.startsWith('<?xml').should.be.true()
    body.includes(itemA._id).should.be.true()
    body.includes(itemB._id).should.be.true()
  })
})

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, getReservedUser, customAuthReq } = require('../utils/utils')
const { getIndexedDoc } = require('../utils/search')
const { getTwoFriends } = require('../fixtures/users')
const { createItem, createItemWithEditionAndWork, createItemWithAuthor, createItemWithAuthorAndSerie } = require('../fixtures/items')
const endpoint = '/api/items?action=search'
const { wait } = __.require('lib', 'promises')
const { shouldNotBeCalled } = require('../utils/utils')
const firstNWords = (str, num) => str.split(' ').slice(0, num).join(' ')
const { updateDelay: elasticsearchUpdateDelay } = CONFIG.elasticsearch
const itemsIndex = CONFIG.db.name('items')

const search = (reqUser, userId, search) => {
  let url = endpoint
  if (userId) url += `&user=${userId}`
  if (search) url += `&search=${encodeURIComponent(search)}`
  return customAuthReq(reqUser, 'get', url)
}

describe('items:search:indexation', () => {
  it('should index items with snapshot data', async () => {
    const user = await getUser()
    const item = await createItemWithEditionAndWork(user)
    await wait(elasticsearchUpdateDelay)
    const res = await getIndexedDoc(itemsIndex, item._id)

    res.found.should.be.true()
    res._id.should.equal(item._id)
    res._source.owner.should.equal(user._id)
    res._source.snapshot['entity:title'].should.be.a.String()
  })
})

describe('items:search', () => {
  it('should reject if no user id is set', async () => {
    const user = await getUser()
    try {
      await search(user, null, 'foo').then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: user')
    }
  })

  it('should reject if no search text is set', async () => {
    const user = await getUser()
    try {
      await search(user, user._id).then(shouldNotBeCalled)
    } catch (err) {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: search')
    }
  })

  it('should find a user item by title', async () => {
    const user = await getUser()
    const [ item ] = await Promise.all([
      createItemWithEditionAndWork(user),
      // Create more items to check that we are not just getting all user items
      createItemWithEditionAndWork(user),
      createItemWithEditionAndWork(user)
    ])
    await wait(elasticsearchUpdateDelay)
    const { 'entity:title': title } = item.snapshot
    const { items } = await search(user, user._id, title)
    // There might be other results, but the searched item should come first
    items[0]._id.should.equal(item._id)
  })

  it('should find a user item by subtitle', async () => {
    const user = await getUser()
    const [ item ] = await Promise.all([
      createItemWithEditionAndWork(user),
      // Create more items to check that we are not just getting all user items
      createItemWithEditionAndWork(user),
      createItemWithEditionAndWork(user)
    ])
    await wait(elasticsearchUpdateDelay)
    const { 'entity:subtitle': subtitle } = item.snapshot
    const { items } = await search(user, user._id, subtitle)
    items[0]._id.should.equal(item._id)
  })

  it('should find a user item by author', async () => {
    const user = await getUser()
    const [ item ] = await Promise.all([
      createItemWithAuthor(user),
      // Create more items to check that we are not just getting all user items
      createItemWithAuthor(user),
      createItemWithAuthor(user)
    ])
    await wait(elasticsearchUpdateDelay)
    const { 'entity:authors': authors } = item.snapshot
    const { items } = await search(user, user._id, authors)
    items[0]._id.should.equal(item._id)
  })

  it('should find a user item by serie', async () => {
    const user = await getUser()
    const [ item ] = await Promise.all([
      createItemWithAuthorAndSerie(user),
      // Create more items to check that we are not just getting all user items
      createItemWithAuthorAndSerie(user),
      createItemWithAuthorAndSerie(user)
    ])
    await wait(elasticsearchUpdateDelay)
    const { 'entity:series': series } = item.snapshot
    const { items } = await search(user, user._id, series)
    items[0]._id.should.equal(item._id)
  })

  it('should find a user item by title and author', async () => {
    const user = await getUser()
    const [ item ] = await Promise.all([
      createItemWithAuthorAndSerie(user),
      // Create more items to check that we are not just getting all user items
      createItemWithAuthorAndSerie(user),
      createItemWithAuthorAndSerie(user)
    ])
    await wait(elasticsearchUpdateDelay)
    const { 'entity:title': title, 'entity:authors': authors } = item.snapshot
    const input = `${firstNWords(authors, 1)} ${firstNWords(title, 2)}`
    const { items } = await search(user, user._id, input)
    items[0]._id.should.equal(item._id)
  })

  it('should find only allowed items for a network user', async () => {
    const [ userA, userB ] = await getTwoFriends()
    const privateItem = await createItemWithEditionAndWork(userA, { listing: 'private' })
    const networkItem = await createItem(userA, { entity: privateItem.entity, listing: 'network' })
    await wait(elasticsearchUpdateDelay)
    const { 'entity:title': title } = privateItem.snapshot
    const { items } = await search(userB, userA._id, title)
    const itemsIds = _.map(items, '_id')
    itemsIds.should.not.containEql(privateItem._id)
    itemsIds.should.containEql(networkItem._id)
  })

  it('should find only allowed items for a public user', async () => {
    const userA = await getUser()
    const userB = await getReservedUser()
    const privateItem = await createItemWithEditionAndWork(userA, { listing: 'network' })
    const networkItem = await createItem(userA, { entity: privateItem.entity, listing: 'network' })
    const publicItem = await createItem(userA, { entity: privateItem.entity, listing: 'public' })
    await wait(elasticsearchUpdateDelay)
    const { 'entity:title': title } = privateItem.snapshot
    const { items } = await search(userB, userA._id, title)
    const itemsIds = _.map(items, '_id')
    itemsIds.should.not.containEql(privateItem._id)
    itemsIds.should.not.containEql(networkItem._id)
    itemsIds.should.containEql(publicItem._id)
  })
})

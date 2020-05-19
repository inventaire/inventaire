const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { getUser, customAuthReq } = require('../utils/utils')
const { createItemWithEditionAndWork, createItemWithAuthor, createItemWithAuthorAndSerie } = require('../fixtures/items')
const endpoint = '/api/items?action=search'
const { wait } = __.require('lib', 'promises')
const { shouldNotBeCalled } = require('../utils/utils')
const firstNWords = (str, num) => str.split(' ').slice(0, num).join(' ')

const search = (reqUser, userId, search) => {
  let url = endpoint
  if (userId) url += `&user=${userId}`
  if (search) url += `&search=${encodeURIComponent(search)}`
  return customAuthReq(reqUser, 'get', url)
}

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
    await wait(1000)
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
    await wait(1000)
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
    await wait(1000)
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
    await wait(1000)
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
    await wait(1000)
    const { 'entity:title': title, 'entity:authors': authors } = item.snapshot
    const input = `${firstNWords(authors, 1)} ${firstNWords(title, 2)}`
    const { items } = await search(user, user._id, input)
    items[0]._id.should.equal(item._id)
  })
})

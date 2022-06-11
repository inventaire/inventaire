const _ = require('builders/utils')
const should = require('should')
const { getUser, getReservedUser, customAuthReq } = require('../utils/utils')
const { waitForIndexation } = require('../utils/search')
const { getTwoFriends } = require('../fixtures/users')
const { createItem, createItemWithEditionAndWork, createItemWithAuthor, createItemWithAuthorAndSerie } = require('../fixtures/items')
const { shouldNotBeCalled } = require('../utils/utils')
const { createEdition } = require('tests/api/fixtures/entities')
const { getSomeGroupWithAMember, createGroupAndMember } = require('tests/api/fixtures/groups')
const { makeFriends } = require('tests/api/utils/relations')
const firstNWords = (str, num) => str.split(' ').slice(0, num).join(' ')

const endpoint = '/api/items?action=search'

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
    await waitForIndexation('items', item._id)
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
    await waitForIndexation('items', item._id)
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
    await waitForIndexation('items', item._id)
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
    await waitForIndexation('items', item._id)
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
    await waitForIndexation('items', item._id)
    const { 'entity:title': title, 'entity:authors': authors } = item.snapshot
    const input = `${firstNWords(authors, 1)} ${firstNWords(title, 2)}`
    const { items } = await search(user, user._id, input)
    items[0]._id.should.equal(item._id)
  })

  describe('visibility:public', () => {
    it('should find items visible by a public user', async () => {
      const userA = await getUser()
      const userB = await getReservedUser()
      const privateItem = await createItemWithEditionAndWork(userA, { visibility: [] })
      const networkItem = await createItem(userA, { entity: privateItem.entity, visibility: [ 'friends' ] })
      const publicItem = await createItem(userA, { entity: privateItem.entity, visibility: [ 'public' ] })
      await Promise.all([
        waitForIndexation('items', privateItem._id),
        waitForIndexation('items', networkItem._id),
        waitForIndexation('items', publicItem._id),
      ])
      const { 'entity:title': title } = privateItem.snapshot
      const { items } = await search(userB, userA._id, title)
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(privateItem._id)
      itemsIds.should.not.containEql(networkItem._id)
      itemsIds.should.containEql(publicItem._id)
    })
  })

  describe('visibility:friends', () => {
    it('should find items visible by friends', async () => {
      const [ userA, userB ] = await getTwoFriends()
      const privateItem = await createItemWithEditionAndWork(userA, { visibility: [] })
      const networkItem = await createItem(userA, { entity: privateItem.entity, visibility: [ 'friends' ] })
      await Promise.all([
        waitForIndexation('items', privateItem._id),
        waitForIndexation('items', networkItem._id),
      ])
      const { 'entity:title': title } = privateItem.snapshot
      const { items } = await search(userB, userA._id, title)
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(privateItem._id)
      itemsIds.should.containEql(networkItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })
  })

  describe('visibility:groups', () => {
    it('should find items visible by groups', async () => {
      const { admin, member } = await getSomeGroupWithAMember()
      const { uri } = await createEdition()
      const [ privateItem, friendsOnlyItem, groupsOnlyItem ] = await Promise.all([
        createItem(admin, { entity: uri, visibility: [] }),
        createItem(admin, { entity: uri, visibility: [ 'friends' ] }),
        createItem(admin, { entity: uri, visibility: [ 'groups' ] }),
      ])
      await Promise.all([
        waitForIndexation('items', privateItem._id),
        waitForIndexation('items', friendsOnlyItem._id),
        waitForIndexation('items', groupsOnlyItem._id),
      ])
      const { 'entity:title': title } = privateItem.snapshot
      const { items } = await search(member, admin._id, title)
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(privateItem._id)
      itemsIds.should.not.containEql(friendsOnlyItem._id)
      itemsIds.should.containEql(groupsOnlyItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })

    it('should not find items visible by groups while the users are friends but not in a common group', async () => {
      const { member } = await getSomeGroupWithAMember()
      const { member: memberOfAnotherGroup } = await createGroupAndMember()
      await makeFriends(member, memberOfAnotherGroup)
      const { uri } = await createEdition()
      const groupsOnlyItem = await createItem(member, { entity: uri, visibility: [ 'groups' ] })
      await waitForIndexation('items', groupsOnlyItem._id)
      const { 'entity:title': title } = groupsOnlyItem.snapshot
      const { items } = await search(memberOfAnotherGroup, member._id, title)
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(groupsOnlyItem._id)
    })
  })

  describe('visibility:group-specific', () => {
    it('should find items visible by a specific group to which the requester belongs', async () => {
      const { group, admin, member } = await getSomeGroupWithAMember()
      const { uri } = await createEdition()
      const groupSpecificItem = await createItem(admin, { entity: uri, visibility: [ `group:${group._id}` ] })
      await waitForIndexation('items', groupSpecificItem._id)
      const { 'entity:title': title } = groupSpecificItem.snapshot
      const { items } = await search(member, admin._id, title)
      const itemsIds = _.map(items, '_id')
      itemsIds.should.containEql(groupSpecificItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })

    it('should not find items visible by a specific group to which the requester does not belong', async () => {
      const { group, member } = await getSomeGroupWithAMember()
      const { member: memberOfAnotherGroup } = await createGroupAndMember()
      await makeFriends(member, memberOfAnotherGroup)
      const { uri } = await createEdition()
      const groupSpecificItem = await createItem(member, { entity: uri, visibility: [ `group:${group._id}` ] })
      await waitForIndexation('items', groupSpecificItem._id)
      const { 'entity:title': title } = groupSpecificItem.snapshot
      const { items } = await search(memberOfAnotherGroup, member._id, title)
      const itemsIds = _.map(items, '_id')
      itemsIds.should.not.containEql(groupSpecificItem._id)
      items.forEach(item => should(item.visibility).not.be.ok())
    })
  })
})

import 'should'
import { map } from 'lodash-es'
import { humanName } from '#fixtures/text'
import { getGroupVisibilityKey } from '#lib/visibility/visibility'
import { getUser, authReq, publicReq, getUserGetter } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'
import { getSomeGroup, addMember, createGroup } from '../fixtures/groups.js'
import { createItem } from '../fixtures/items.js'

const userPromise = getUserGetter(humanName())()

const endpoint = '/api/items?action=by-users'

describe('items:get-by-users', () => {
  it('should get an item by user', async () => {
    const item = await createItem(null, { visibility: [ 'public' ] })
    const { items } = await publicReq('get', `${endpoint}&users=${item.owner}`)
    items[0]._id.should.equal(item._id)
  })

  it('should get user items', async () => {
    const items = await Promise.all([
      createItem(getUser(), { visibility: [] }),
      createItem(getUser(), { visibility: [ 'public' ] }),
      createItem(getUser(), { visibility: [ 'friends' ] }),
    ])
    const itemsIds = map(items, '_id')
    const userId = items[0].owner
    const { items: resItems } = await authReq('get', `${endpoint}&users=${userId}`)
    const resUserId = map(resItems, 'owner')
    const resItemsIds = map(resItems, '_id')
    resUserId.should.containEql(userId)
    resItemsIds.should.containDeep(itemsIds)
  })

  it('should not return the requesting user private and friend-only items in a group context', async () => {
    const user = await getUser()
    const group = await createGroup({ user })
    const groupVisibilityKey = getGroupVisibilityKey(group._id)
    const [ groupsItem, privateItem, publicItem, friendsItem ] = await Promise.all([
      createItem(user, { visibility: [ 'groups' ] }),
      createItem(user, { visibility: [] }),
      createItem(user, { visibility: [ 'public' ] }),
      createItem(user, { visibility: [ 'friends' ] }),
    ])
    const userId = groupsItem.owner
    const { items } = await authReq('get', `${endpoint}&users=${userId}&context=${groupVisibilityKey}`)
    const resUserId = map(items, 'owner')
    resUserId.should.containEql(userId)
    const resItemsIds = map(items, '_id')
    resItemsIds.should.containEql(publicItem._id)
    resItemsIds.should.containEql(groupsItem._id)
    resItemsIds.should.not.containEql(friendsItem._id)
    resItemsIds.should.not.containEql(privateItem._id)
  })

  it("should reject invalid context'", async () => {
    const user = await getUser()
    const { _id: userId } = user
    await authReq('get', `${endpoint}&users=${userId}&context=bla`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid context')
    })
  })

  describe('visibility:public', () => {
    it('should include public items of other users', async () => {
      const user = await userPromise
      const userId = user._id
      const item = await createItem(userPromise, { visibility: [ 'public' ] })
      const res = await publicReq('get', `${endpoint}&users=${userId}`)
      map(res.items, '_id').should.containEql(item._id)
    })
  })

  describe('visibility:friends', () => {
    it('should get someone else public items', async () => {
      const [ publicItem, privateItem, friendsItem ] = await Promise.all([
        createItem(userPromise, { visibility: [ 'public' ] }),
        createItem(userPromise, { visibility: [] }),
        createItem(userPromise, { visibility: [ 'friends' ] }),
      ])
      const userId = publicItem.owner
      const { items: resItems } = await authReq('get', `${endpoint}&users=${userId}`)
      const resItemsIds = map(resItems, '_id')
      resItemsIds.should.containEql(publicItem._id)
      resItemsIds.should.not.containEql(friendsItem._id)
      resItemsIds.should.not.containEql(privateItem._id)
    })
  })

  describe('visibility:private', () => {
    it('should not include private items of other users', async () => {
      const user = await userPromise
      const userId = user._id
      const item = await createItem(userPromise, { visibility: [] })
      const res = await authReq('get', `${endpoint}&users=${userId}`)
      map(res.items, '_id').should.not.containEql(item._id)
    })
  })

  describe('visibility:groups', () => {
    it('should include group items of other group users', async () => {
      await addMember(getSomeGroup(), userPromise)
      const user = await userPromise
      const userId = user._id
      const item = await createItem(userPromise, { visibility: [ 'groups' ] })
      const res = await authReq('get', `${endpoint}&users=${userId}`)
      map(res.items, '_id').should.containEql(item._id)
    })

    it('should not include group items of non-group co-members', async () => {
      const userPromise = getUserGetter(humanName())()
      const user = await userPromise
      const userId = user._id
      const item = await createItem(userPromise, { visibility: [ 'groups' ] })
      const res = await authReq('get', `${endpoint}&users=${userId}`)
      map(res.items, '_id').should.not.containEql(item._id)
    })
  })
})

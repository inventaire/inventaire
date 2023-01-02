import should from 'should'
import _ from '#builders/utils'
import {
  getUser,
  authReq,
  publicReq,
  shouldNotBeCalled,
  rethrowShouldNotBeCalledErrors,
  getUserGetter,
  customAuthReq,
} from '#tests/api/utils/utils'
import { getSomeGroup, addMember } from '../fixtures/groups.js'
import { createItem, createItems } from '../fixtures/items.js'
import { humanName } from '../fixtures/entities.js'
import { createShelfWithItem } from '../fixtures/shelves.js'

const endpoint = '/api/items?action=by-ids'
const userPromise = getUserGetter(humanName())()

describe('items:get-by-ids', () => {
  it('should reject without id', async () => {
    try {
      await authReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should get an item by id', async () => {
    const item = await createItem(getUser())
    const res = await authReq('get', `${endpoint}&ids=${item._id}`)
    res.items[0]._id.should.equal(item._id)
  })

  it('should get items by ids', async () => {
    const emptyItemsData = [ {}, {}, {} ]
    const items = await createItems(getUser(), emptyItemsData)
    const ids = _.map(items, '_id').sort()
    const res = await authReq('get', `${endpoint}&ids=${ids.join('|')}`)
    const resIds = _.map(res.items, '_id').sort()
    resIds.should.deepEqual(ids)
    resIds.length.should.equal(ids.length)
  })

  it('should include users if requested', async () => {
    const item = await createItem(getUser())
    const res = await authReq('get', `${endpoint}&ids=${item._id}&include-users=true`)
    res.items[0]._id.should.equal(item._id)
    res.users[0]._id.should.equal(item.owner)
  })

  describe('private attributes', () => {
    it('should remove private attributes when requested by non-owner users', async () => {
      const item = await createItem(userPromise, { visibility: [ 'public' ] })
      const res = await publicReq('get', `${endpoint}&ids=${item._id}`)
      should(res.items[0].visibility).not.be.ok()
    })

    it('should include private attributes when requested by owner', async () => {
      const item = await createItem(userPromise, { visibility: [ 'public' ] })
      const res = await customAuthReq(userPromise, 'get', `${endpoint}&ids=${item._id}`)
      should(res.items[0].visibility).be.ok()
    })
  })

  describe('visibility:public', () => {
    it('should include public items of other users', async () => {
      const item = await createItem(userPromise, { visibility: [ 'public' ] })
      const res = await publicReq('get', `${endpoint}&ids=${item._id}`)
      _.map(res.items, '_id').should.containEql(item._id)
    })
  })

  describe('visibility:private', () => {
    it('should not include private items of other users', async () => {
      const item = await createItem(userPromise, { visibility: [] })
      const res = await authReq('get', `${endpoint}&ids=${item._id}`)
      _.map(res.items, '_id').should.not.containEql(item._id)
    })
  })

  describe('visibility:groups', () => {
    it('should include group items of other group users', async () => {
      await addMember(getSomeGroup(), userPromise)
      const item = await createItem(userPromise, { visibility: [ 'groups' ] })
      const res = await authReq('get', `${endpoint}&ids=${item._id}`)
      _.map(res.items, '_id').should.containEql(item._id)
    })

    it('should not include group items of non-group co-members', async () => {
      const userPromise = getUserGetter(humanName())()
      const item = await createItem(userPromise, { visibility: [ 'groups' ] })
      const res = await authReq('get', `${endpoint}&ids=${item._id}`)
      _.map(res.items, '_id').should.not.containEql(item._id)
    })
  })

  describe('shelves', () => {
    it('should include shelves id', async () => {
      const { shelf, item } = await createShelfWithItem({ visibility: [ 'public' ] })
      const res = await authReq('get', `${endpoint}&ids=${item._id}`)
      res.items[0].shelves.should.deepEqual([ shelf._id ])
    })

    xit('should not include private shelf id', async () => {
      const { item } = await createShelfWithItem({ visibility: [] })
      const res = await authReq('get', `${endpoint}&ids=${item._id}`)
      res.items[0].shelves.should.deepEqual([])
    })
  })
})

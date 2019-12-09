const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { getUser, authReq, shouldNotGetHere, rethrowShouldNotGetHereErrors, getUserGetter } = __.require('apiTests', 'utils/utils')
const { groupPromise, addMember } = require('../fixtures/groups')
const { createItem, createItems } = require('../fixtures/items')
const { humanName } = require('../fixtures/entities')

const endpoint = '/api/items?action=by-ids'
const userPromise = getUserGetter(humanName())()

describe('items:get-by-ids', () => {
  it('should reject without id', async () => {
    try {
      const res = await authReq('get', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
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

  it('should include public items of other users', async () => {
    const itemAPromise = await createItem(userPromise, { listing: 'public' })
    const res = await authReq('get', `${endpoint}&ids=${itemAPromise._id}`)
    res.items.map(_.property('_id')).should.containEql(itemAPromise._id)
  })

  it('should not include private items of other users', async () => {
    const itemAPromise = await createItem(userPromise, { listing: 'private' })
    const res = await authReq('get', `${endpoint}&ids=${itemAPromise._id}`)
    res.items.map(_.property('_id')).should.not.containEql(itemAPromise._id)
  })

  it('should include group items of other group users', async () => {
    await addMember(groupPromise, userPromise)
    const itemAPromise = await createItem(userPromise, { listing: 'network' })
    const res = await authReq('get', `${endpoint}&ids=${itemAPromise._id}`)
    res.items.map(_.property('_id')).should.containEql(itemAPromise._id)
  })

  it('should not include group items of other group users', async () => {
    const userPromise = getUserGetter(humanName())()
    const itemAPromise = await createItem(userPromise, { listing: 'network' })
    const res = await authReq('get', `${endpoint}&ids=${itemAPromise._id}`)
    res.items.map(_.property('_id')).should.not.containEql(itemAPromise._id)
  })
})

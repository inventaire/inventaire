import 'should'
import { some } from 'lodash-es'
import { populate } from '#fixtures/populate'
import { createShelfWithItem } from '#fixtures/shelves'
import { expired } from '#lib/time'
import { authReqB, publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

const recentPublicUrl = '/api/items?action=recent-public'

describe('items:recent-public', () => {
  it('should fetch 15 recent-public items', async () => {
    await populate()
    const res = await publicReq('get', recentPublicUrl)
    res.items.length.should.equal(15)
  })

  it('should fetch items from different owners', async () => {
    await populate()
    const res = await publicReq('get', recentPublicUrl)
    res.users.length.should.be.above(1)
  })

  it('should take a limit parameter', async () => {
    await populate()
    const res = await publicReq('get', `${recentPublicUrl}&limit=3`)
    res.items.length.should.equal(3)
  })

  it('should take a lang parameter', async () => {
    await populate()
    const res = await publicReq('get', `${recentPublicUrl}&lang=en`)
    some(res.items, itemLangIs('en')).should.be.true()
  })

  it('should return some of the most recent items', async () => {
    await populate()
    const res = await publicReq('get', recentPublicUrl)
    some(res.items, createdLately).should.be.true()
  })

  it('should reject invalid limit', async () => {
    await publicReq('get', `${recentPublicUrl}&limit=bla`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid limit: bla')
    })
  })

  it('should reject invalid lang', async () => {
    await publicReq('get', `${recentPublicUrl}&lang=blablabla`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid lang: blablabla')
    })
  })

  describe('shelves', () => {
    it('should include shelves id', async () => {
      const { shelf, item } = await createShelfWithItem({ visibility: [ 'public' ] })
      const res = await publicReq('get', recentPublicUrl)
      res.items.find(i => i._id === item._id).shelves.should.deepEqual([ shelf._id ])
    })

    it('should not include private shelf id', async () => {
      const shelfData = { visibility: [] }
      const itemData = { visibility: [ 'public' ] }
      const { item } = await createShelfWithItem(shelfData, itemData)
      const res = await authReqB('get', recentPublicUrl)
      res.items.find(i => i._id === item._id).shelves.should.deepEqual([])
    })
  })
})

const itemLangIs = lang => item => item.snapshot['entity:lang'] === lang
const createdLately = item => !expired(item.created, 120000)

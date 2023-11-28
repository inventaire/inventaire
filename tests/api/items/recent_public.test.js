import 'should'
import { some } from 'lodash-es'
import { expired } from '#lib/time'
import { publicReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { populate } from '../fixtures/populate.js'

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
    await publicReq('get', `${recentPublicUrl}&lang=bla`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('invalid lang: bla')
    })
  })
})

const itemLangIs = lang => item => item.snapshot['entity:lang'] === lang
const createdLately = item => !expired(item.created, 120000)

import { map } from 'lodash-es'
import { someCouchUuid } from '#fixtures/general'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createListing, createElement } from '../fixtures/listings.js'
import { publicReq, authReq, authReqB } from '../utils/utils.js'

const endpoint = '/api/lists?action=by-ids'

describe('listings:by-ids', () => {
  it('should reject without ids', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should be empty when the id does not exist', async () => {
    await publicReq('get', `${endpoint}&ids=${someCouchUuid}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get a public listing', async () => {
      const { listing } = await createListing()
      const res = await publicReq('get', `${endpoint}&ids=${listing._id}`)
      res.lists[listing._id].should.be.ok()
    })

    it('should not return a private listing to an authentified user', async () => {
      const { listing } = await createListing(null, { visibility: [] })
      await authReqB('get', `${endpoint}&ids=${listing._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  it('should set warnings when some requested listings can not be returned', async () => {
    const [ { listing: privateListing }, { listing: publicListing } ] = await Promise.all([
      createListing(null, { visibility: [] }),
      createListing(null, { visibility: [ 'public' ] }),
    ])
    const ids = [ someCouchUuid, privateListing._id, publicListing._id ]
    const res = await publicReq('get', `${endpoint}&ids=${ids.join('|')}`)
    Object.keys(res.lists).should.deepEqual([ publicListing._id ])
    res.warnings.should.containEql(`listings not found: ${someCouchUuid}`)
    res.warnings.should.containEql(`unauthorized listings access: ${privateListing._id}`)
  })

  describe('with-elements', () => {
    it('should get lists with empty elements', async () => {
      const { listing } = await createListing()
      const res = await authReq('get', `${endpoint}&ids=${listing._id}&with-elements=true`)
      res.lists[listing._id].elements.should.be.deepEqual([])
    })

    it('should get lists with elements', async () => {
      const { uri, listing } = await createElement({})
      const res = await authReq('get', `${endpoint}&ids=${listing._id}&with-elements=true`)
      const { elements } = res.lists[listing._id]
      map(elements, 'uri').should.containEql(uri)
    })
  })
})

import { map } from 'lodash-es'
import { someCouchUuid } from '#fixtures/general'
import { getListingById, getByIdWithElements } from '#tests/api/utils/listings'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils'
import { createListing, createElement } from '../fixtures/listings.js'
import { publicReq, authReqB } from '../utils/utils.js'

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
    return getListingById({ id: someCouchUuid })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get a public listing', async () => {
      const { listing } = await createListing()
      const resListing = await getListingById({ id: listing._id })
      resListing.should.be.ok()
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
      const resListing = await getByIdWithElements({ id: listing._id })
      resListing.elements.should.be.deepEqual([])
    })

    it('should get list with elements', async () => {
      const { uri, listing } = await createElement({})
      const { elements } = await getByIdWithElements({ id: listing._id })
      map(elements, 'uri').should.containEql(uri)
    })
  })
})

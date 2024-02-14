import { createEdition } from '../fixtures/entities.js'
import { createListing } from '../fixtures/listings.js'
import { authReq } from '../utils/utils.js'

const endpoint = '/api/lists?action='
const byIds = `${endpoint}by-ids&with-elements=true`

describe('element:listing-ordinal', () => {
  it('should add elements with ordinals', async () => {
    const { listing } = await createListing()
    const { uri } = await createEdition()
    await authReq('post', `${endpoint}add-elements`, {
      id: listing._id,
      uris: [ uri ],
    })
    const res = await authReq('get', `${byIds}&ids=${listing._id}`)
    const firstListing = res.lists[listing._id]
    firstListing.elements[0].ordinal.should.equal(0)
  })
})

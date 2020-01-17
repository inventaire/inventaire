const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { authReq } = require('../utils/utils')
const { createShelf } = require('../fixtures/shelves')

const endpoint = '/api/shelves?action=by-ids'

describe('shelves:by-ids', () => {
  it('should reject without ids', async () => {
    try {
      const res = await authReq('get', endpoint)
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should get shelves without items by default', async () => {
    const shelf = await createShelf()
    const res = await authReq('get', `${endpoint}&ids=${shelf._id}`)
    res.shelves.should.be.ok()
  })

  it('should get shelves items when passing with-items params', async () => {
    const shelf = await createShelf()
    const res = await authReq('get', `${endpoint}&ids=${shelf._id}&with-items=true`)
    _.values(res.shelves)[0].items.should.be.an.Array()
  })
})

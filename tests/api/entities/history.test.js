require('should')
const { adminReq, shouldNotBeCalled } = require('../utils/utils')
const { createHuman } = require('../fixtures/entities')
const endpoint = '/api/entities?action=history'

describe('entities:history', () => {
  it('should reject without uri', async () => {
    await adminReq('get', endpoint)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: id')
    })
  })

  it('should throw when passed an invalid id', async () => {
    await adminReq('get', `${endpoint}&id=foo`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.error_name.should.equal('invalid_id')
    })
  })

  it('should return entity patches', async () => {
    const human = await createHuman()
    const { patches } = await adminReq('get', `${endpoint}&id=${human._id}`)
    patches[0].snapshot.labels.should.deepEqual(human.labels)
  })
})

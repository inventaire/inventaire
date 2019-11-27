require('should')
const { nonAuthReq, undesiredErr, undesiredRes } = require('../utils/utils')
const { createHuman } = require('../fixtures/entities')
const endpoint = '/api/entities?action=history'

describe('entities:history', () => {
  it('should reject without uri', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: id')
      done()
    })
    .catch(done)
  })

  it('should throw when passed an invalid id', done => {
    nonAuthReq('get', `${endpoint}&id=foo`)
    .catch(err => {
      err.body.error_name.should.equal('invalid_id')
      done()
    })
    .catch(undesiredErr(done))
  })

  it('should return entity patches', done => {
    createHuman()
    .then(human => {
      nonAuthReq('get', `${endpoint}&id=${human._id}`)
      .then(res => {
        res.patches[0].snapshot.labels.should.deepEqual(human.labels)
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})

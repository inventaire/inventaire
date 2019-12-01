const { nonAuthReq, undesiredErr, undesiredRes } = require('../utils/utils')
const { groupPromise } = require('../fixtures/groups')
const endpoint = '/api/groups?action=by-id'

describe('groups:by-id', () => {
  it('should reject without id', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: id')
      done()
    })
    .catch(done)
  })

  it('should get a group by id', done => {
    groupPromise
    .then(group => {
      nonAuthReq('get', `${endpoint}&id=${group._id}`)
      .then(res => {
        res.group._id.should.equal(group._id)
        res.group.name.should.equal(group.name)
        res.group.slug.should.equal(group.slug)
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})

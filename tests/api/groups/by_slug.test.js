const { nonAuthReq, undesiredRes } = require('../utils/utils')
const { groupPromise } = require('../fixtures/groups')
const endpoint = '/api/groups?action=by-slug'

describe('groups:by-slug', () => {
  it('should reject without slug', done => {
    nonAuthReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: slug')
      done()
    })
    .catch(done)
  })

  it('should get a group by slug', done => {
    groupPromise
    .then(group => {
      nonAuthReq('get', `${endpoint}&slug=${group.slug}`)
      .then(res => {
        res.group._id.should.equal(group._id)
        res.group.name.should.equal(group.name)
        res.group.slug.should.equal(group.slug)
        done()
      })
    })
    .catch(done)
  })
})

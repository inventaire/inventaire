const { nonAuthReq } = require('../utils/utils')
const endpoint = '/api/groups?action=last'

describe('groups:last', () => {
  it('should return last groups created', done => {
    nonAuthReq('get', endpoint)
    .then(res => {
      res.groups.should.be.an.Array()
      res.groups[0]._id.should.be.ok()
      done()
    })
    .catch(done)
  })
})

const { adminReq } = require('../utils/utils')
const endpoint = '/api/entities?action=activity'

describe('entities:activity', () => {
  it('should return user and contributions number', done => {
    adminReq('get', endpoint)
    .then(res => {
      res.activity.should.be.an.Array()
      res.activity[0].user.should.be.a.String()
      res.activity[0].contributions.should.be.a.Number()
      done()
    })
    .catch(done)
  })
})

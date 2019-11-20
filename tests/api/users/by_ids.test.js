require('should')
const { nonAuthReq, getUser, undesiredErr } = require('../utils/utils')

describe('users:by-ids', () => it('should get a user', done => {
  getUser()
  .then(user => {
    const userId = user._id
    return nonAuthReq('get', `/api/users?action=by-ids&ids=${userId}`)
    .then(res => {
      res.users.should.be.an.Object()
      res.users[userId].should.be.an.Object()
      res.users[userId]._id.should.equal(userId)
      done()
    })
  })
  .catch(undesiredErr(done))
}))

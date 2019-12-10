const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const { shouldNotGetHere, rethrowShouldNotGetHereErrors } = __.require('apiTests', 'utils/utils')
const { nonAuthReq, getUser, getUserB } = require('../utils/utils')

const endpoint = '/api/users?action=by-ids'

describe('users:by-ids', () => {
  it('should reject without id', async () => {
    try {
      const res = await nonAuthReq('get', endpoint, {})
      shouldNotGetHere(res)
    } catch (err) {
      rethrowShouldNotGetHereErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should get a user', async () => {
    const user = await getUser()
    const userId = user._id
    const res = await nonAuthReq('get', `${endpoint}&ids=${userId}`)
    res.users.should.be.an.Object()
    res.users[userId].should.be.an.Object()
    res.users[userId]._id.should.equal(userId)
  })

  it('should get several users', async () => {
    const users = await Promise.all([ getUser(), getUserB() ])
    const ids = users.map(_.property('_id'))
    const res = await nonAuthReq('get', `${endpoint}&ids=${ids.join('|')}`)
    _.keys(res.users).should.deepEqual(ids)
  })
})

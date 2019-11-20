const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, undesiredErr } = __.require('apiTests', 'utils/utils')

describe('notifications:get', () => it('should get user notifications', done => {
  authReq('get', '/api/notifications')
  .then(res => {
    res.notifications.should.be.an.Array()
    done()
  })
  .catch(undesiredErr(done))
}))

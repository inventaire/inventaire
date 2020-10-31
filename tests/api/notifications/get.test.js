const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq } = __.require('apiTests', 'utils/utils')

describe('notifications:get', () => {
  it('should get user notifications', async () => {
    const { notifications, total } = await authReq('get', '/api/notifications')
    notifications.should.be.an.Array()
    total.should.be.aboveOrEqual(0)
  })
})

const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq } = __.require('apiTests', 'utils/utils')

describe('notifications:get', () => {
  it('should get user notifications', async () => {
    const { notifications } = await authReq('get', '/api/notifications')
    notifications.should.be.an.Array()
  })
})

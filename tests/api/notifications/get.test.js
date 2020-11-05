const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { getUser, getReservedUser, authReq } = __.require('apiTests', 'utils/utils')
const { makeFriends } = __.require('apiTests', 'utils/relations')

describe('notifications:get', () => {
  it('should get user notifications', async () => {
    const user = await getUser()
    const friend = await getReservedUser()
    await makeFriends(user, friend)

    const { notifications, total } = await authReq('get', '/api/notifications')
    notifications.should.be.an.Array()
    total.should.be.aboveOrEqual(1)

    const notif = notifications.pop()
    notif.user.should.be.equal(user._id)
    notif.type.should.be.equal('friendAcceptedRequest')
    notif.status.should.be.equal('unread')
  })
})

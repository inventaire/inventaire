require('should')
const { getUser, getReservedUser, authReq } = require('apiTests/utils/utils')
const { makeFriends } = require('apiTests/utils/relations')

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

  it('should get user in chronological order', async () => {
    const user = await getUser()
    const friend = await getReservedUser()
    const friend2 = await getReservedUser()
    await makeFriends(user, friend)
    await makeFriends(user, friend2)

    const { notifications, total } = await authReq('get', '/api/notifications')
    notifications.should.be.an.Array()
    total.should.be.aboveOrEqual(2)

    let previousTime = Infinity
    for (const notification of notifications) {
      notification.time.should.be.belowOrEqual(previousTime)
      previousTime = notification.time
    }
  })
})

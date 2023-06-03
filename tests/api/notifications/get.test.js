import 'should'
import { makeFriends } from '#tests/api/utils/relations'
import { customAuthReq } from '#tests/api/utils/request'
import { getReservedUser, getUser, getUserB } from '#tests/api/utils/utils'

describe('notifications:get', () => {
  it('should get user notifications', async () => {
    const requester = await getReservedUser()
    const requestee = await getUser()
    await makeFriends(requester, requestee)

    const { notifications, total } = await customAuthReq(requester, 'get', '/api/notifications')
    notifications.should.be.an.Array()
    total.should.be.aboveOrEqual(1)

    const notif = notifications.pop()
    notif.type.should.be.equal('friendAcceptedRequest')
    notif.user.should.be.equal(requester._id)
    notif.status.should.be.equal('unread')
  })

  it('should get user in chronological order', async () => {
    const [
      requester,
      friendA,
      friendB,
    ] = await Promise.all([
      getReservedUser(),
      getUser(),
      getUserB(),
    ])
    await makeFriends(requester, friendA)
    await makeFriends(requester, friendB)

    const { notifications, total } = await customAuthReq(requester, 'get', '/api/notifications')
    notifications.should.be.an.Array()
    total.should.be.aboveOrEqual(2)

    let previousTime = Infinity
    for (const notification of notifications) {
      notification.time.should.be.belowOrEqual(previousTime)
      previousTime = notification.time
    }
  })
})

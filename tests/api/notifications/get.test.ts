import 'should'
import { createUser } from '#fixtures/users'
import { wait } from '#lib/promises'
import config from '#server/config'
import { makeFriends } from '#tests/api/utils/relations'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser, getUserB } from '#tests/api/utils/utils'

const { shortDelay } = config.db

describe('notifications:get', () => {
  it('should get user notifications', async () => {
    const requester = await createUser()
    const requestee = await getUser()
    await makeFriends(requester, requestee)

    await wait(shortDelay)
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
      createUser(),
      getUser(),
      getUserB(),
    ])
    await makeFriends(requester, friendA)
    await makeFriends(requester, friendB)

    await wait(shortDelay)
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

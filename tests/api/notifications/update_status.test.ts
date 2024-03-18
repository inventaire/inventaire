import 'should'
import { map } from 'lodash-es'
import { createUser } from '#fixtures/users'
import { wait } from '#lib/promises'
import config from '#server/config'
import { getNotifications } from '#tests/api/utils/notifications'
import { makeFriends } from '#tests/api/utils/relations'
import { customAuthReq } from '#tests/api/utils/request'
import { getUser } from '#tests/api/utils/utils'

const { shortDelay } = config.db

describe('notifications:update status', () => {
  it('should update a notification', async () => {
    const user = await getUser()
    const friend = await createUser()
    await makeFriends(user, friend)
    await wait(shortDelay)
    const notifications = await getNotifications({ user, type: 'friendAcceptedRequest', subject: friend._id })
    notifications.length.should.equal(1)
    notifications[0].status.should.equal('unread')
    await customAuthReq(user, 'post', '/api/notifications', {
      times: map(notifications, 'time'),
    })
    const updatedNotifications = await getNotifications({ user, type: 'friendAcceptedRequest', subject: friend._id })
    updatedNotifications.length.should.equal(1)
    updatedNotifications[0].status.should.equal('read')
  })
})

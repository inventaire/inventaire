const _ = require('builders/utils')
require('should')
const { getUser, getReservedUser, customAuthReq } = require('tests/api/utils/utils')
const { makeFriends } = require('tests/api/utils/relations')
const { getNotifications } = require('tests/api/utils/notifications')

describe('notifications:update status', () => {
  it('should update a notification', async () => {
    const user = await getUser()
    const friend = await getReservedUser()
    await makeFriends(user, friend)
    const notifications = await getNotifications({ user, type: 'friendAcceptedRequest', subject: friend._id })
    notifications.length.should.equal(1)
    notifications[0].status.should.equal('unread')
    await customAuthReq(user, 'post', '/api/notifications', {
      times: _.map(notifications, 'time')
    })
    const updatedNotifications = await getNotifications({ user, type: 'friendAcceptedRequest', subject: friend._id })
    updatedNotifications.length.should.equal(1)
    updatedNotifications[0].status.should.equal('read')
  })
})

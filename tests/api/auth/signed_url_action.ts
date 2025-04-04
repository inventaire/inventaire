import should from 'should'
import { getRefreshedUser, createUser } from '#fixtures/users'
import { getEmailUnsubscribeUrl } from '#lib/emails/unsubscribe'
import { rawRequest } from '#tests/api/utils/request'

describe('user:sign-url-update', () => {
  it('should unsubscribe from a notification', async () => {
    const user = await createUser()
    should(user.settings.notifications.inventories_activity_summary).not.be.ok()
    const unsubscribeUrl = getEmailUnsubscribeUrl(user._id, 'inventories_activity_summary')
    await rawRequest('get', unsubscribeUrl)
    const updatedUser = await getRefreshedUser(user)
    updatedUser.settings.notifications.inventories_activity_summary.should.equal(false)
  })
})

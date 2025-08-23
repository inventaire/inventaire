import should from 'should'
import { getRefreshedUser, createUser } from '#fixtures/users'
import { getEmailUnsubscribeUrl } from '#lib/emails/unsubscribe'
import { rawRequest } from '#tests/api/utils/request'

describe('auth:signed-url', () => {
  describe('get', () => {
    it('should redirect to the client signed-url action page', async () => {
      const user = await createUser()
      const unsubscribeUrl = getEmailUnsubscribeUrl(user._id, 'inventories_activity_summary')
      const { searchParams } = new URL(unsubscribeUrl)
      const { data, sig } = Object.fromEntries(searchParams)
      const { statusCode, headers } = await rawRequest('get', unsubscribeUrl)
      statusCode.should.equal(302)
      headers.location.should.equal(`/signed-url-action?data=${data}&sig=${sig}`)
      const updatedUser = await getRefreshedUser(user)
      should(updatedUser.settings.notifications.inventories_activity_summary).not.be.ok()
    })
  })

  describe('post', () => {
    it('should unsubscribe from a notification', async () => {
      const user = await createUser()
      should(user.settings.notifications.inventories_activity_summary).not.be.ok()
      const unsubscribeUrl = getEmailUnsubscribeUrl(user._id, 'inventories_activity_summary')
      await rawRequest('post', unsubscribeUrl)
      const updatedUser = await getRefreshedUser(user)
      updatedUser.settings.notifications.inventories_activity_summary.should.equal(false)
    })
  })
})

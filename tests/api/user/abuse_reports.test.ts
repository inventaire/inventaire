import should from 'should'
import { createWork } from '#fixtures/entities'
import { createGroup } from '#fixtures/groups'
import { createItem } from '#fixtures/items'
import { createElement, createListing, updateElement, updateListing } from '#fixtures/listings'
import { createShelf } from '#fixtures/shelves'
import { createUser, someSpamText } from '#fixtures/users'
import { buildUrl } from '#lib/utils/url'
import { addClaim, updateLabel } from '#tests/api/utils/entities'
import { updateGroup } from '#tests/api/utils/groups'
import { updateItem, updateItems } from '#tests/api/utils/items'
import { updateShelf } from '#tests/api/utils/shelves'
import { catchSpamRejection, updateUser } from '#tests/api/utils/users'
import { adminReq, authReq } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils/utils'

let spammyUser

describe('user:abuse reports', () => {
  describe('spam', () => {
    before(async () => {
      spammyUser = await createUser()
    })

    it('should reject user bio spam', async () => {
      await shouldBeRejectedAsSpam(updateUser({ user: spammyUser, attribute: 'bio', value: someSpamText }))
    })

    it('should reject item details spam during creation', async () => {
      await shouldBeRejectedAsSpam(createItem(spammyUser, { details: someSpamText }))
    })

    it('should reject item details spam during update', async () => {
      const item = await createItem(spammyUser)
      item.details = someSpamText
      await shouldBeRejectedAsSpam(updateItem(item, spammyUser))
    })

    it('should reject item details spam during bulk update', async () => {
      const item = await createItem(spammyUser)
      await shouldBeRejectedAsSpam(updateItems({ ids: item._id, attribute: 'details', value: someSpamText, user: spammyUser }))
    })

    it('should reject shelf description spam during creation', async () => {
      await shouldBeRejectedAsSpam(createShelf(spammyUser, { description: someSpamText }))
    })

    it('should reject shelf description spam during update', async () => {
      const { shelf } = await createShelf(spammyUser)
      await shouldBeRejectedAsSpam(updateShelf({ id: shelf._id, attribute: 'description', value: someSpamText, user: spammyUser }))
    })

    it('should reject listing description spam during creation', async () => {
      await shouldBeRejectedAsSpam(createListing(spammyUser, { description: someSpamText }))
    })

    it('should reject listing description spam during update', async () => {
      const { listing } = await createListing(spammyUser)
      listing.description = someSpamText
      await shouldBeRejectedAsSpam(updateListing(spammyUser, listing))
    })

    it('should reject listing element comment spam during update', async () => {
      const { element } = await createElement({}, spammyUser)
      element.comment = someSpamText
      await shouldBeRejectedAsSpam(updateElement(element, spammyUser))
    })

    it('should reject group name spam during creation', async () => {
      await shouldBeRejectedAsSpam(createGroup({ name: someSpamText, user: spammyUser }))
    })

    it('should reject group name spam during update', async () => {
      const group = await createGroup({ user: spammyUser })
      await shouldBeRejectedAsSpam(updateGroup({ group, user: spammyUser, attribute: 'name', value: someSpamText }))
    })

    it('should reject group description spam during creation', async () => {
      await shouldBeRejectedAsSpam(createGroup({ description: someSpamText, user: spammyUser }))
    })

    it('should reject group description spam during update', async () => {
      const group = await createGroup({ user: spammyUser })
      await shouldBeRejectedAsSpam(updateGroup({ group, user: spammyUser, attribute: 'description', value: someSpamText }))
    })

    it('should reject entity label spam', async () => {
      const { uri } = await createWork()
      await shouldBeRejectedAsSpam(updateLabel({ uri, lang: 'en', value: someSpamText, user: spammyUser }))
    })

    it('should reject entity claim value spam', async () => {
      const { uri } = await createWork()
      await shouldBeRejectedAsSpam(addClaim({ uri, property: 'wdt:P1476', value: someSpamText, user: spammyUser }))
    })
  })

  describe('reports access', () => {
    it('should let admin users access the abuse reports', async () => {
      const user = await createUser()
      await updateUser({ user, attribute: 'bio', value: someSpamText }).catch(catchSpamRejection)
      const { users: adminViewUsers } = await adminReq('get', buildUrl('/api/users', { action: 'by-ids', ids: user._id }))
      const adminViewUser = adminViewUsers[user._id]
      const { reports } = adminViewUser
      reports.length.should.equal(1)
      reports[0].type.should.equal('spam')
    })

    it('should not let non-admin users get the abuse report', async () => {
      const user = await createUser()
      await updateUser({ user, attribute: 'bio', value: someSpamText }).catch(catchSpamRejection)
      const { users: nonAdminViewUsers } = await authReq('get', buildUrl('/api/users', { action: 'by-ids', ids: user._id }))
      const nonAdminViewUser = nonAdminViewUsers[user._id]
      should(nonAdminViewUser.reports).not.be.ok()
    })
  })
})

async function shouldBeRejectedAsSpam (promise: Promise<unknown>) {
  await promise
  .then(shouldNotBeCalled)
  .catch(err => {
    err.statusCode.should.equal(403)
    err.body.status_verbose.should.containEql('spam')
  })
}

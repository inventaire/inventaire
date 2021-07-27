require('should')
const { wait } = require('lib/promises')
const { createItem } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { getActivitiesByUsername } = require('../utils/activities')

describe('create:activity', () => {
  describe('at:items:creation', () => {
    it('should not create activity if item do not have a fediversable owner', async () => {
      const user = createUser({ fediversable: false })
      await createItem(user)
      const { username } = await user
      const res = await getActivitiesByUsername(username)
      res.length.should.equal(0)
    })

    it('should create activity', async () => {
      const user = createUser({ fediversable: true })
      await wait(50)
      const item = await createItem(user)
      const { username } = await user
      const res = await getActivitiesByUsername(username)
      const firstActivity = res[0]
      firstActivity.type.should.containEql('Create')
      firstActivity.object.should.be.ok()
      firstActivity.object.itemsIds.should.containEql(item._id)
    })
  })
})

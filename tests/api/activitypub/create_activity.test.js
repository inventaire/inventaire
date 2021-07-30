require('should')
const { wait } = require('lib/promises')
const { createItem, createItems } = require('../fixtures/items')
const { createUser } = require('../fixtures/users')
const { getActivitiesByUsername } = require('../utils/activities')
const { activitiesDebounceTime } = require('config')

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
      await wait(activitiesDebounceTime)
      const res = await getActivitiesByUsername(username)
      const firstActivity = res[0]
      firstActivity.type.should.containEql('Create')
      firstActivity.object.should.be.ok()
      firstActivity.object.itemsIds.should.containEql(item._id)
    })
  })
})

describe('update:activity:items', () => {
  it('should return an activity when creating items in bulk', async () => {
    const user = createUser({ fediversable: true })
    await createItems(user, [ { listing: 'public' }, { listing: 'public' } ])
    const { username } = await user
    await wait(activitiesDebounceTime)
    const res = await getActivitiesByUsername(username)
    res.length.should.equal(1)
  })

  it('should return an activity when creating items sequentially', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    await createItem(user)
    const { username } = await user
    await wait(activitiesDebounceTime)
    const res = await getActivitiesByUsername(username)
    res.length.should.equal(1)
  })

  it('should return several activities when creating items at a different time', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    await wait(activitiesDebounceTime)
    await createItem(user)
    const { username } = await user
    await wait(activitiesDebounceTime)
    const res = await getActivitiesByUsername(username)
    res.length.should.equal(2)
  })

  it('should not return recent activities', async () => {
    const user = createUser({ fediversable: true })
    await createItem(user)
    const { username } = await user
    const res = await getActivitiesByUsername(username)
    res.length.should.equal(0)
  })
})

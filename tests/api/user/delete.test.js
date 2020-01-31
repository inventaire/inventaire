const __ = require('config').universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { wait } = __.require('lib', 'promises')
const { getReservedUser, customAuthReq, authReq } = require('../utils/utils')
const { getRefreshedUser } = require('../fixtures/users')
const { createItem } = require('../fixtures/items')
const { getById: getItemById } = require('../utils/items')
const { getUsersNearPosition, getRandomPosition } = require('../utils/users')
const deleteUser = user => customAuthReq(user, 'delete', '/api/user')
const { createGroup, getGroup, addMember, addAdmin } = require('../fixtures/groups')

describe('user:delete', () => {
  it('should delete the user', async () => {
    const user = await getReservedUser()
    const res = await deleteUser(user)
    res.ok.should.be.true()
    const deletedUser = await getRefreshedUser(user)
    deletedUser._id.should.equal(user._id)
    const previousRevInteger = parseInt(user._rev.split('-')[0])
    parseInt(deletedUser._rev.split('-')[0]).should.equal(previousRevInteger + 1)
    deletedUser.username.should.equal(user.username)
    should(deletedUser.password).not.be.ok()
    should(deletedUser.email).not.be.ok()
    should(deletedUser.settings).not.be.ok()
    should(deletedUser.readToken).not.be.ok()
    should(deletedUser.picture).not.be.ok()
    should(deletedUser.snapshot).not.be.ok()
  })

  it('should delete the user items', async () => {
    const user = await getReservedUser()
    const item = await createItem(user, { listing: 'public' })
    const deleteRes = await deleteUser(user)
    deleteRes.ok.should.be.true()
    const updatedItem = await getItemById(item)
    should(updatedItem).not.be.ok()
  })

  it('should remove the user from the geo index', async () => {
    const position = getRandomPosition()
    const user = await getReservedUser({ position })
    // Using long pauses as the position indexation sometimes fails
    // to update before the request by position
    await wait(1000)
    const users = await getUsersNearPosition(authReq, position)
    _.map(users, '_id').should.containEql(user._id)
    await deleteUser(user)
    await wait(1000)
    const refreshedUsers = await getUsersNearPosition(authReq, position)
    _.map(refreshedUsers, '_id').should.not.containEql(user._id)
  })

  describe('groups', () => {
    it('should remove the user when member', async () => {
      const user = await getReservedUser()
      const group = await createGroup()
      const [ refreshedGroup ] = await addMember(group, user)
      _.map(refreshedGroup.members, 'user').should.containEql(user._id)
      await wait(100)
      await deleteUser(user)
      await wait(100)
      const rerefreshedGroup = await getGroup(group)
      _.map(rerefreshedGroup.members, 'user').should.not.containEql(user._id)
    })

    it('should remove the user when admin', async () => {
      const user = await getReservedUser()
      const group = await createGroup()
      const [ refreshedGroup ] = await addAdmin(group, user)
      _.map(refreshedGroup.admins, 'user').should.containEql(user._id)
      await wait(100)
      await deleteUser(user)
      await wait(100)
      const rerefreshedGroup = await getGroup(group)
      _.map(rerefreshedGroup.admins, 'user').should.not.containEql(user._id)
    })
  })
})

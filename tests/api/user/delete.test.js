const _ = require('builders/utils')
const should = require('should')
const { wait } = require('lib/promises')
const { getReservedUser, getUser, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('../utils/utils')
const { getRefreshedUser, getRandomPosition } = require('../fixtures/users')
const { createItem } = require('../fixtures/items')
const { getById: getItemById } = require('../utils/items')
const { getUsersNearPosition, deleteUser } = require('../utils/users')
const { createGroup, getGroup, addMember, addAdmin } = require('../fixtures/groups')
const { createTransaction } = require('../fixtures/transactions')
const { getTransaction, updateTransaction } = require('../utils/transactions')
const { createShelf } = require('../fixtures/shelves')
const { getShelfById } = require('../utils/shelves')

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

  it('should remove the user from the geo index', async () => {
    const position = getRandomPosition()
    const user = await getReservedUser({ position })
    // Using long pauses as the position indexation sometimes fails
    // to update before the request by position
    await wait(1000)
    const users = await getUsersNearPosition(position)
    _.map(users, '_id').should.containEql(user._id)
    await deleteUser(user)
    await wait(1000)
    const refreshedUsers = await getUsersNearPosition(position)
    _.map(refreshedUsers, '_id').should.not.containEql(user._id)
  })

  describe('items', () => {
    it('should delete the user items', async () => {
      const user = await getReservedUser()
      const item = await createItem(user, { listing: 'public' })
      const deleteRes = await deleteUser(user)
      deleteRes.ok.should.be.true()
      const updatedItem = await getItemById(item)
      should(updatedItem).not.be.ok()
    })
  })

  describe('shelves', () => {
    it('should delete the user shelves', async () => {
      const user = await getReservedUser()
      const { shelf } = await createShelf(user, { listing: 'public' })
      const deleteRes = await deleteUser(user)
      deleteRes.ok.should.be.true()
      const updatedShelf = await getShelfById(getUser(), shelf._id)
      should(updatedShelf).not.be.ok()
    })
  })

  describe('groups', () => {
    it('should remove the user when member', async () => {
      const user = await getReservedUser()
      const group = await createGroup()
      const [ refreshedGroup ] = await addMember(group, user)
      _.map(refreshedGroup.members, 'user').should.containEql(user._id)
      await deleteUser(user)
      const rerefreshedGroup = await getGroup(group)
      _.map(rerefreshedGroup.members, 'user').should.not.containEql(user._id)
    })

    it('should remove the user when admin, but not delete the group', async () => {
      const user = await getReservedUser()
      const group = await createGroup()
      const [ refreshedGroup ] = await addAdmin(group, user)
      _.map(refreshedGroup.admins, 'user').should.containEql(user._id)
      await deleteUser(user)
      const rerefreshedGroup = await getGroup(group)
      _.map(rerefreshedGroup.admins, 'user').should.not.containEql(user._id)
    })

    it('should delete the group when the user was the last member', async () => {
      const user = await getReservedUser()
      const group = await createGroup({ user })
      _.map(group.admins, 'user').should.containEql(user._id)
      await deleteUser(user)
      try {
        await getGroup(group).then(shouldNotBeCalled)
      } catch (err) {
        rethrowShouldNotBeCalledErrors(err)
        err.statusCode.should.equal(404)
      }
    })
  })

  describe('transactions', () => {
    it('should cancel active transactions', async () => {
      const user = await getReservedUser()
      const { transaction } = await createTransaction({ userA: user, userB: getUser() })
      transaction.state.should.equal('requested')
      await deleteUser(user)
      const updatedTransaction = await getTransaction(user, transaction._id)
      updatedTransaction.state.should.equal('cancelled')
    })

    it('should not affect already terminated transactions', async () => {
      const user = await getReservedUser()
      const { transaction } = await createTransaction({ userA: user, userB: getUser() })
      transaction.state.should.equal('requested')
      await updateTransaction(getUser(), transaction._id, 'declined')
      const updatedTransaction = await getTransaction(user, transaction._id)
      updatedTransaction.state.should.equal('declined')
      await deleteUser(user)
      const reupdatedTransaction = await getTransaction(user, transaction._id)
      reupdatedTransaction.state.should.equal('declined')
      reupdatedTransaction._rev.should.equal(updatedTransaction._rev)
    })
  })
})

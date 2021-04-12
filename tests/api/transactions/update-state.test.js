require('should')
const _ = require('builders/utils')
const { authReqB, authReqC, shouldNotBeCalled } = require('apiTests/utils/utils')
const { createTransaction, getSomeTransaction } = require('../fixtures/transactions')
const { updateTransaction } = require('../utils/transactions')
const { getById: getItem } = require('../utils/items')
const { wait } = require('lib/promises')
const { getUserC } = require('../utils/utils')

const endpoint = '/api/transactions?action=update-state'

describe('transactions:update-state', () => {
  it('should update state', async () => {
    const { transaction } = await createTransaction()
    const updateRes = await authReqB('put', endpoint, {
      transaction: transaction._id,
      state: 'accepted'
    })
    updateRes.ok.should.be.true()
  })

  it('should not update unknown state', async () => {
    const { transaction } = await getSomeTransaction()
    await authReqB('put', endpoint, {
      transaction: transaction._id,
      state: 'random state'
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid state')
    })
  })

  it('should not update when requested by a user not involved in transaction', async () => {
    const { transaction } = await getSomeTransaction()
    await authReqC('put', endpoint, {
      transaction: transaction._id,
      state: 'accepted'
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('wrong user')
    })
  })

  describe('side effects: item.busy flag', () => {
    describe('giving and selling transactions', () => {
      const itemData = { transaction: _.sample([ 'giving', 'selling' ]), listing: 'public' }

      it('should be false when the transaction is just requested', async () => {
        const { userBItem } = await createTransaction({ itemData })
        userBItem.busy.should.be.false()
      })

      it('should be true when the transaction is accepted', async () => {
        const { transaction, userBItem, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'accepted')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.true()
      })

      it('should be false when the transaction is just declined', async () => {
        const { transaction, userBItem, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'declined')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.false()
      })

      it('should be false when the transaction is confirmed and change owner', async () => {
        const { transaction, userBItem, userA, userB } = await createTransaction({ itemData })
        userBItem.owner.should.equal(userB._id)
        await updateTransaction(userB, transaction, 'accepted')
        await updateTransaction(userA, transaction, 'confirmed')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.owner.should.equal(userA._id)
        updatedItem.busy.should.be.false()
      })

      it('should be false when the transaction is cancelled', async () => {
        const { transaction, userBItem, userA, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'accepted')
        await updateTransaction(userA, transaction, 'cancelled')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.false()
      })
    })

    describe('lending transactions', () => {
      const itemData = { transaction: 'lending', listing: 'public' }

      it('should be false when the transaction is just requested', async () => {
        const { userBItem } = await createTransaction({ itemData })
        userBItem.busy.should.be.false()
      })

      it('should be true when the transaction is accepted', async () => {
        const { transaction, userBItem, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'accepted')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.true()
      })

      it('should be false when the transaction is just declined', async () => {
        const { transaction, userBItem, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'declined')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.false()
      })

      it('should be true when the transaction is confirmed', async () => {
        const { transaction, userBItem, userA, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'accepted')
        await updateTransaction(userA, transaction, 'confirmed')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.true()
      })

      it('should be false when the transaction is returned', async () => {
        const { transaction, userBItem, userA, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'accepted')
        await updateTransaction(userA, transaction, 'confirmed')
        await updateTransaction(userB, transaction, 'returned')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.false()
      })

      it('should be false when the transaction is cancelled', async () => {
        const { transaction, userBItem, userA, userB } = await createTransaction({ itemData })
        await updateTransaction(userB, transaction, 'accepted')
        await updateTransaction(userA, transaction, 'confirmed')
        await updateTransaction(userA, transaction, 'cancelled')
        await wait(100)
        const updatedItem = await getItem(userBItem)
        updatedItem.busy.should.be.false()
      })
    })
  })

  describe('concurrent transactions', () => {
    it("should not allow to 'accept' when the item is already busy", async () => {
      const { transaction: transactionX, userB, userBItem } = await createTransaction()
      const { transaction: transactionY } = await createTransaction({ userA: getUserC(), item: userBItem })
      await updateTransaction(userB, transactionX, 'accepted')
      await wait(100)
      await updateTransaction(userB, transactionY, 'accepted')
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
        err.body.status_verbose.should.equal('item already busy')
      })
    })
  })
})

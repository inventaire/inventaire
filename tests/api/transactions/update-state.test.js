import 'should'
import { sample } from 'lodash-es'
import { authReqB, authReqC } from '#tests/api/utils/utils'
import { shouldNotBeCalled } from '#tests/unit/utils'
import { createTransaction, getSomeTransaction } from '../fixtures/transactions.js'
import { getItem } from '../utils/items.js'
import { updateTransaction } from '../utils/transactions.js'
import { getUserC } from '../utils/utils.js'

const endpoint = '/api/transactions?action=update-state'

describe('transactions:update-state', () => {
  it('should update state', async () => {
    const { transaction } = await createTransaction()
    const updateRes = await authReqB('put', endpoint, {
      transaction: transaction._id,
      state: 'accepted',
    })
    updateRes.ok.should.be.true()
    updateRes.transaction.state.should.equal('accepted')
  })

  it('should not update unknown state', async () => {
    const { transaction } = await getSomeTransaction()
    await authReqB('put', endpoint, {
      transaction: transaction._id,
      state: 'random state',
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
      state: 'accepted',
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('wrong user')
    })
  })

  describe('side effects: item.busy flag', () => {
    describe('giving and selling transactions', () => {
      const itemData = { transaction: sample([ 'giving', 'selling' ]), visibility: [ 'public' ] }

      it('should be false when the transaction is just requested', async () => {
        const { item } = await createTransaction({ itemData })
        item.busy.should.be.false()
      })

      it('should be true when the transaction is accepted', async () => {
        const { transaction, item, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'accepted')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.true()
      })

      it('should be false when the transaction is just declined', async () => {
        const { transaction, item, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'declined')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.false()
      })

      it('should be false when the transaction is confirmed and change owner', async () => {
        const { transaction, item, requester, owner } = await createTransaction({ itemData })
        item.owner.should.equal(owner._id)
        await updateTransaction(owner, transaction, 'accepted')
        await updateTransaction(requester, transaction, 'confirmed')
        const updatedItem = await getItem(item)
        updatedItem.owner.should.equal(requester._id)
        updatedItem.busy.should.be.false()
      })

      it('should be false when the transaction is cancelled', async () => {
        const { transaction, item, requester, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'accepted')
        await updateTransaction(requester, transaction, 'cancelled')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.false()
      })
    })

    describe('lending transactions', () => {
      const itemData = { transaction: 'lending', visibility: [ 'public' ] }

      it('should be false when the transaction is just requested', async () => {
        const { item } = await createTransaction({ itemData })
        item.busy.should.be.false()
      })

      it('should be true when the transaction is accepted', async () => {
        const { transaction, item, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'accepted')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.true()
      })

      it('should be false when the transaction is just declined', async () => {
        const { transaction, item, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'declined')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.false()
      })

      it('should be true when the transaction is confirmed', async () => {
        const { transaction, item, requester, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'accepted')
        await updateTransaction(requester, transaction, 'confirmed')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.true()
      })

      it('should be false when the transaction is returned', async () => {
        const { transaction, item, requester, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'accepted')
        await updateTransaction(requester, transaction, 'confirmed')
        await updateTransaction(owner, transaction, 'returned')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.false()
      })

      it('should be false when the transaction is cancelled', async () => {
        const { transaction, item, requester, owner } = await createTransaction({ itemData })
        await updateTransaction(owner, transaction, 'accepted')
        await updateTransaction(requester, transaction, 'confirmed')
        await updateTransaction(requester, transaction, 'cancelled')
        const updatedItem = await getItem(item)
        updatedItem.busy.should.be.false()
      })
    })
  })

  describe('concurrent transactions', () => {
    it("should not allow to 'accept' when the item is already busy", async () => {
      const { transaction: transactionX, owner, item } = await createTransaction()
      const { transaction: transactionY } = await createTransaction({ requester: getUserC(), item })
      await updateTransaction(owner, transactionX, 'accepted')
      await updateTransaction(owner, transactionY, 'accepted')
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
        err.body.status_verbose.should.equal('item already busy')
      })
    })
  })
})

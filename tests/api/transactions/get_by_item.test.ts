import 'should'
import { getTransactionsByItem } from '#tests/api/utils/transactions'
import { getUserC } from '#tests/api/utils/utils'
import { createTransaction } from '../fixtures/transactions.js'

describe('transactions:get:by-item', () => {
  it('should get a transaction by item, as item owner', async () => {
    const { transaction, owner, item } = await createTransaction()
    const { transactions } = await getTransactionsByItem(owner, item._id)
    transactions.length.should.equal(1)
    transactions[0]._id.should.equal(transaction._id)
  })

  it('should get a transaction by item, as item requester', async () => {
    const { transaction, requester, item } = await createTransaction()
    const { transactions } = await getTransactionsByItem(requester, item._id)
    transactions.length.should.equal(1)
    transactions[0]._id.should.equal(transaction._id)
  })

  it('should not get a transaction not involving the requesting user', async () => {
    const { item } = await createTransaction()
    const { transactions } = await getTransactionsByItem(getUserC(), item._id)
    transactions.length.should.equal(0)
  })
})

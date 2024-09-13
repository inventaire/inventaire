import 'should'
import { map } from 'lodash-es'
import { createTransaction } from '#fixtures/transactions'
import { authReq, authReqC } from '#tests/api/utils/utils'

describe('transactions:get', () => {
  it('should get user transactions', async () => {
    const { transaction } = await createTransaction()
    const res = await authReq('get', '/api/transactions')
    res.transactions.should.be.an.Array()
    const transactionsIds = map(res.transactions, '_id')
    transactionsIds.should.containEql(transaction._id)
  })

  it('should not get other users transactions', async () => {
    const { transaction } = await createTransaction()
    const res = await authReqC('get', '/api/transactions')
    const transactionsIds = map(res.transactions, '_id')
    transactionsIds.should.not.containEql(transaction._id)
  })
})

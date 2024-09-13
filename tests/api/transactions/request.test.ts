import 'should'
import { createEditionFromWorkWithAuthor } from '#fixtures/entities'
import { createItem } from '#fixtures/items'
import { createTransaction } from '#fixtures/transactions'
import { updateTransaction } from '#tests/api/utils/transactions'
import {
  authReq,
  authReqB,
  authReqC,
  getUser,
} from '#tests/api/utils/utils'
import { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } from '#tests/unit/utils/utils'

const endpoint = '/api/transactions?action=request'

describe('transactions:request', () => {
  it('should reject without id', async () => {
    try {
      await authReq('post', endpoint, {}).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: item')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without message', async () => {
    try {
      const item = await createItem()
      await authReq('post', endpoint, { item: item._id }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: message')
      err.statusCode.should.equal(400)
    }
  })

  it('should not request your own items', async () => {
    try {
      const item = await createItem(getUser(), { transaction: 'giving', visibility: [ 'public' ] })
      await authReq('post', endpoint, {
        item: item._id,
        message: 'yo',
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('not allowed with this item')
    }
  })

  it('should not request inventorying items', async () => {
    try {
      const item = await createItem()
      await authReqB('post', endpoint, {
        item: item._id,
        message: 'yo',
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal("this item can't be requested")
    }
  })

  it('should not request inventorying items', async () => {
    const item = await createItem(getUser(), { visibility: [ 'public' ], transaction: 'giving' })
    const res = await authReqB('post', endpoint, {
      item: item._id,
      message: 'yo',
    })
    res.transaction.state.should.equal('requested')
  })

  it('should create a transaction', async () => {
    const edition = await createEditionFromWorkWithAuthor()
    const itemData = { entity: edition.uri, visibility: [ 'public' ], transaction: 'lending' }
    const { transaction, requester, owner, item } = await createTransaction({ itemData })
    transaction.should.be.an.Object()
    transaction.item.should.equal(item._id)
    transaction.requester.should.equal(requester._id)
    transaction.owner.should.equal(owner._id)
    const { snapshot } = transaction
    snapshot.item.entity.should.equal(item.entity)
    snapshot.owner.username.should.equal(owner.username)
    snapshot.requester.username.should.equal(requester.username)
    snapshot.entity.image.should.equal(item.snapshot['entity:image'])
    snapshot.entity.authors.should.equal(item.snapshot['entity:authors'])
  })

  it('should reject if the item is already busy', async () => {
    const { transaction, owner, item } = await createTransaction()
    await updateTransaction(owner, transaction, 'accepted')
    await authReqC('post', endpoint, { item: item._id, message: 'hi' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('item already busy')
    })
  })
})

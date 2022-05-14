const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq, authReqB } = require('../utils/utils')
const { createList, createSelection } = require('../fixtures/lists')

const endpoint = '/api/lists?action=delete'

describe('lists:delete', () => {
  it('should reject without lists ids', async () => {
    try {
      await authReq('post', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject deleting different user list', async () => {
    try {
      const { list } = await createList()
      await authReqB('post', endpoint, { ids: list._id }).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('wrong user')
      err.statusCode.should.equal(403)
    }
  })

  it('should return the deleted list and delete selections', async () => {
    const selectionFixture = await createSelection({})
    const { list: createdList } = selectionFixture
    const { lists } = await authReq('post', endpoint, { ids: createdList._id })
    const [ list ] = lists
    list._id.should.equal(createdList._id)
    list._deleted.should.be.true()
    list.selections[0]._deleted.should.be.true()
  })
})

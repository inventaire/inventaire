const { getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq } = require('../utils/utils')
const { createList } = require('../fixtures/lists')
const { createEdition } = require('../fixtures/entities')
const { someEntityUri } = require('tests/api/fixtures/general')

const endpoint = '/api/lists?action='
const byIds = `${endpoint}by-ids&with-selections=true`

describe('lists:add-selections', () => {
  it('should reject without list id', async () => {
    try {
      await authReq('post', `${endpoint}add-selections`).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without uri', async () => {
    const { list } = await createList()
    try {
      await authReq('post', `${endpoint}add-selections`, {
        id: list._id
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject creating a selection with an unknown entity', async () => {
    const { list } = await createList()
    await authReq('post', `${endpoint}add-selections`, {
      id: list._id,
      uris: [ someEntityUri ]
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(403)
      err.body.status_verbose.should.equal('entities not found')
    })
    const res = await authReq('get', `${byIds}&ids=${list._id}`)
    const firstList = res.lists[list._id]
    firstList.selections.length.should.equal(0)
  })

  it('should add uri and create selection', async () => {
    const { list } = await createList()
    const { uri } = await createEdition()
    await authReq('post', `${endpoint}add-selections`, {
      id: list._id,
      uris: [ uri ]
    })
    const res = await authReq('get', `${byIds}&ids=${list._id}`)
    const firstList = res.lists[list._id]
    firstList.selections[0].uri.should.equal(uri)
  })

  it('should reject adding a selection to a list of another user', async () => {
    try {
      const { list } = await createList(getUserB())
      const { uri } = await createEdition()
      await authReq('post', `${endpoint}add-selections`, {
        id: list._id,
        uris: [ uri ]
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.startWith('wrong user')
      err.statusCode.should.equal(403)
    }
  })
})

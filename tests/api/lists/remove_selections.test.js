const { getUserB, shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { authReq } = require('../utils/utils')
const { createList, createSelection } = require('../fixtures/lists')

const endpoint = '/api/lists?action='
const removeSelections = `${endpoint}remove-selections`

const selections_ = require('controllers/lists/lib/selections')
const lists_ = require('controllers/lists/lib/lists')

describe('lists:remove-selections', () => {
  it('should reject without list id', async () => {
    try {
      await authReq('post', removeSelections).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: id')
      err.statusCode.should.equal(400)
    }
  })

  it('should reject without uris', async () => {
    const { list } = await createList()
    try {
      await authReq('post', removeSelections, {
        id: list._id
      })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in body: uris')
      err.statusCode.should.equal(400)
    }
  })

  it('should throw if no uris are found in list', async () => {
    const { list } = await createList()
    const { uri } = await createSelection({})
    await authReq('post', removeSelections, {
      id: list._id,
      uris: [ uri ]
    })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
      err.body.status_verbose.should.equal('not found')
    })
  })

  it('should set warnings when some uris are not found', async () => {
    const { list, uri } = await createSelection({})
    const { uri: uri2 } = await createSelection({})
    const randomUnkownUri = 'inv:a78c6d212de6be6f4aa29741933d276f'
    const res = await authReq('post', removeSelections, {
      id: list._id,
      uris: [ uri, uri2, randomUnkownUri ]
    })
    const warning = res.warnings[0]
    warning.should.startWith('entities uris not found')
    warning.should.containEql(uri2)
    warning.should.containEql(randomUnkownUri)
  })

  it('should reject removing selections of a different user list', async () => {
    try {
      const { list, uri } = await createSelection({}, getUserB())
      await authReq('post', removeSelections, {
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

  it('should remove from list a selection by its entity uris and delete the selection', async () => {
    const { list, uri, selection } = await createSelection({})
    const resList = await lists_.byIdsWithSelections(list._id, list.user)
    resList[0].selections.length.should.equal(1)
    await authReq('post', removeSelections, {
      id: list._id,
      uris: [ uri ]
    })

    await selections_.byId(selection._id)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
      err.body.reason.should.equal('deleted')
    })

    await lists_.byIdsWithSelections(list._id, list.user)
    .then(lists => lists[0].selections.length.should.equal(0))
  })
})

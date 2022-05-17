const _ = require('builders/utils')
const { shouldNotBeCalled, rethrowShouldNotBeCalledErrors } = require('tests/api/utils/utils')
const { publicReq, authReq, authReqB, getUserB } = require('../utils/utils')
const { createList, createSelection } = require('../fixtures/lists')
const { someCouchUuid } = require('tests/api/fixtures/general')

const endpoint = '/api/lists?action=by-ids'

describe('lists:by-ids', () => {
  it('should reject without ids', async () => {
    try {
      await publicReq('get', endpoint).then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.body.status_verbose.should.equal('missing parameter in query: ids')
      err.statusCode.should.equal(400)
    }
  })

  it('should be empty when the id does not exist', async () => {
    await publicReq('get', `${endpoint}&ids=${someCouchUuid}`)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(404)
    })
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get a public list', async () => {
      const { list } = await createList()
      const res = await publicReq('get', `${endpoint}&ids=${list._id}`)
      res.lists[list._id].should.be.ok()
    })

    it('should not return a private list to an authentified user', async () => {
      const { list } = await createList(null, { visibility: [] })
      await authReqB('get', `${endpoint}&ids=${list._id}`)
      .then(shouldNotBeCalled)
      .catch(err => {
        err.statusCode.should.equal(403)
      })
    })
  })

  it('should set warnings when some requested lists can not be returned', async () => {
    const [ { list: privatelist }, { list: publiclist } ] = await Promise.all([
      createList(null, { visibility: [] }),
      createList(null, { visibility: [ 'public' ] }),
    ])
    const ids = [ someCouchUuid, privatelist._id, publiclist._id ]
    const res = await publicReq('get', `${endpoint}&ids=${ids.join('|')}`)
    Object.keys(res.lists).should.deepEqual([ publiclist._id ])
    res.warnings.should.containEql(`lists not found: ${someCouchUuid}`)
    res.warnings.should.containEql(`unauthorized lists access: ${privatelist._id}`)
  })

  describe('with-selections', () => {
    it('should get lists with selections', async () => {
      const { uri, list } = await createSelection({}, getUserB())
      const res = await authReq('get', `${endpoint}&ids=${list._id}&with-selections=true`)
      const { selections } = res.lists[list._id]
      selections.map(_.property('uri')).should.containEql(uri)
    })
  })
})

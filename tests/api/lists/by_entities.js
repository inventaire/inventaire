const should = require('should')
const { publicReq, authReq, getUserB } = require('../utils/utils')
const { createSelection } = require('../fixtures/lists')

const endpoint = '/api/lists?action=by-entities'

describe('lists:by-entities', () => {
  it('should be empty without lists', async () => {
    const res = await publicReq('get', `${endpoint}&uris=inv:5157e0729573118860649f4f620e34d1`)
    res.lists.should.deepEqual({})
  })

  describe('visibility:overview', () => {
  // for detail visibility validations, see ./visibility.test.js
    it('should get public lists by their selections entities uris', async () => {
      const { selection, uri, list } = await createSelection({})
      list.visibility.should.deepEqual([ 'public' ])
      const res = await publicReq('get', `${endpoint}&uris=${uri}`)
      const listsRes = res.lists[uri]
      listsRes.should.be.ok()
      const { selections } = listsRes[0]
      selections.should.be.ok()
      Object.values(selections)[0]._id.should.equal(selection._id)
    })

    it('should not return private selections', async () => {
      const { uri } = await createSelection({ visibility: [] }, getUserB())
      const res = await authReq('get', `${endpoint}&uris=${uri}`)
      should(res.lists[uri]).not.be.ok()
    })
  })

    })

    })
  })
})

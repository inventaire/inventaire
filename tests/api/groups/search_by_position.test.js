const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { publicReq } = require('../utils/utils')
const { groupPromise } = require('../fixtures/groups')
const qs = require('querystring')
const endpoint = '/api/groups?action=search-by-position'

describe('groups:search-by-position', () => {
  it('should reject without bbox', done => {
    publicReq('get', endpoint)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in query: bbox')
      done()
    })
    .catch(done)
  })

  it('should get groups by position', done => {
    groupPromise
    .then(group => {
      const bbox = qs.escape(JSON.stringify([ 0, 0, 2, 2 ]))
      return publicReq('get', `${endpoint}&bbox=${bbox}`)
      .then(res => {
        res.groups.should.be.an.Array()
        const groupsIds = _.map(res.groups, '_id')
        should(groupsIds.includes(group._id)).be.true()
        done()
      })
    })
    .catch(done)
  })
})

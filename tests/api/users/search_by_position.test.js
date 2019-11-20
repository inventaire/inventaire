
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')
const { nonAuthReq } = require('../utils/utils')
const { createUser } = require('../fixtures/users')
const qs = require('querystring')

describe('groups:search-by-position', () => it('should get groups by position', done => {
  createUser({ position: [ 1, 1 ] })
  .delay(100)
  .then(user => {
    const bbox = qs.escape(JSON.stringify([ 0, 0, 2, 2 ]))
    return nonAuthReq('get', `/api/users?action=search-by-position&bbox=${bbox}`)
    .then(res => {
      res.users.should.be.an.Array()
      const usersIds = _.map(res.users, '_id')
      should(usersIds.includes(user._id)).be.true()
      done()
    })
  })
  .catch(done)
}))

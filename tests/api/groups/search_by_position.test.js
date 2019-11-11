// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
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
const { groupPromise, endpointAction } = require('../fixtures/groups')
const qs = require('querystring')

describe('groups:search-by-position', () => it('should get groups by position', (done) => {
  groupPromise
  .then((group) => {
    const bbox = qs.escape(JSON.stringify([ 0, 0, 2, 2 ]))
    return nonAuthReq('get', `${endpointAction}=search-by-position&bbox=${bbox}`)
    .then((res) => {
      res.groups.should.be.an.Array()
      const groupsIds = _.map(res.groups, '_id')
      should(groupsIds.includes(group._id)).be.true()
      done()
    })}).catch(done)

}))

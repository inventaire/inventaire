const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { authReq, undesiredRes } = __.require('apiTests', 'utils/utils')
const endpoint = '/api/items?action=inventory-view'
const { groupPromise } = require('../fixtures/groups')

describe('items:inventory-view', async () => {
  it('should reject requests without a user or a group', done => {
    authReq('get', endpoint)
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in query: user or group')
      done()
    })
    .catch(done)
  })

  it('should return a user inventory-view', done => {
    getUser()
    .get('_id')
    .then(userId => authReq('get', `${endpoint}&user=${userId}`))
    .then(res => {
      res.worksTree.should.be.an.Object()
      res.worksTree.owner.should.be.an.Object()
      res.workUriItemsMap.should.be.an.Object()
      res.itemsByDate.should.be.an.Array()
      done()
    })
    .catch(done)
  })

  it('should return a group inventory-view', done => {
    groupPromise
    .get('_id')
    .then(groupId => authReq('get', `${endpoint}&group=${groupId}`))
    .then(res => {
      res.worksTree.should.be.an.Object()
      res.worksTree.owner.should.be.an.Object()
      res.workUriItemsMap.should.be.an.Object()
      res.itemsByDate.should.be.an.Array()
      done()
    })
    .catch(done)
  })
})

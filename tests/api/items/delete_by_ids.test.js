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
const { authReq, authReqB, getUser, undesiredRes } = require('../utils/utils')
const { CountChange } = require('./helpers')
const { createItem } = require('../fixtures/items')
const debounceDelay = CONFIG.itemsCountDebounceTime + 100

const deleteByIds = function(ids, authReqFn){
  if (!authReqFn) { authReqFn = authReq }
  ids = _.forceArray(ids)
  return authReqFn('post', '/api/items?action=delete-by-ids', { ids })
}

describe('items:delete-by-ids', () => {
  it('should reject an empty list of ids', (done) => {
    deleteByIds([])
    .then(undesiredRes(done))
    .catch((err) => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("ids array can't be empty")
      return done()}).catch(done)

  })

  it('should ignore already deleted items', (done) => {
    createItem()
    .then((item) => {
      const { _id: itemId } = item
      return deleteByIds(itemId)
      .then((res) => {
        res.ok.should.be.true()
        return deleteByIds(itemId)
        .then((res) => {
          res.ok.should.be.true()
          return done()
        })
      })}).catch(done)

  })

  it('should delete an item', (done) => {
    createItem()
    .then((item) => {
      const { _id: itemId } = item
      return deleteByIds(itemId)
      .then((res) => {
        res.ok.should.be.true()
        return authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
        .then((res) => {
          res.items.length.should.equal(0)
          return done()
        })
      })}).catch(done)

  })

  it('should trigger an update of the users items counters', (done) => {
    createItem()
    // Delay to let the time to the item counter to be updated
    .delay(debounceDelay)
    .then(item => getUser()
    .then(userBefore => deleteByIds(item._id)
    // Delay to request the user after its items count was updated
    .delay(debounceDelay)
    .then(res => getUser()
    .then((userAfter) => {
      const countChange = CountChange(userBefore.snapshot, userAfter.snapshot)
      countChange('public').should.equal(-1)
      return done()
    })))).catch(done)

  })

  return it('should reject deletion of an item owned by another user', (done) => {
    createItem()
    .then((item) => {
      const { _id: itemId } = item
      return deleteByIds(itemId, authReqB)
      .then(undesiredRes(done))
      .catch((err) => {
        err.statusCode.should.equal(403)
        err.body.status_verbose.should.equal("user isn't item owner")
        return done()
      })}).catch(done)

  })
})

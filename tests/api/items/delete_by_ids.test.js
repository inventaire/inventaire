const CONFIG = require('config')
const _ = require('builders/utils')
const { Wait } = require('lib/promises')
require('should')
const { authReq, authReqB, getUser, undesiredRes } = require('../utils/utils')
const { CountChange } = require('./helpers')
const { createItem } = require('../fixtures/items')
const debounceDelay = CONFIG.itemsCountDebounceTime + 500

const deleteByIds = (ids, authReqFn) => {
  if (!authReqFn) { authReqFn = authReq }
  ids = _.forceArray(ids)
  return authReqFn('post', '/api/items?action=delete-by-ids', { ids })
}

describe('items:delete-by-ids', () => {
  it('should reject an empty list of ids', done => {
    deleteByIds([])
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("ids array can't be empty")
      done()
    })
    .catch(done)
  })

  it('should ignore already deleted items', done => {
    createItem()
    .then(item => {
      const { _id: itemId } = item
      return deleteByIds(itemId)
      .then(res => {
        res.ok.should.be.true()
        return deleteByIds(itemId)
        .then(res => {
          res.ok.should.be.true()
          done()
        })
      })
    })
    .catch(done)
  })

  it('should delete an item', done => {
    createItem()
    .then(item => {
      const { _id: itemId } = item
      return deleteByIds(itemId)
      .then(res => {
        res.ok.should.be.true()
        return authReq('get', `/api/items?action=by-ids&ids=${itemId}`)
        .then(res => {
          res.items.length.should.equal(0)
          done()
        })
      })
    })
    .catch(done)
  })

  it('should trigger an update of the users items counters', done => {
    createItem()
    // Delay to let the time to the item counter to be updated
    .then(Wait(debounceDelay))
    .then(item => {
      return getUser()
      .then(userBefore => {
        return deleteByIds(item._id)
        // Delay to request the user after its items count was updated
        .then(Wait(debounceDelay))
        .then(res => {
          return getUser()
          .then(userAfter => {
            const countChange = CountChange(userBefore.snapshot, userAfter.snapshot)
            countChange('public').should.equal(-1)
            done()
          })
        })
      })
    })
    .catch(done)
  })

  it('should reject deletion of an item owned by another user', done => {
    createItem()
    .then(item => {
      const { _id: itemId } = item
      return deleteByIds(itemId, authReqB)
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(403)
        err.body.status_verbose.should.equal("user isn't item owner")
        done()
      })
    })
    .catch(done)
  })
})

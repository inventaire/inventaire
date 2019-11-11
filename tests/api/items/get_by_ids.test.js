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
const { getUser, authReq, undesiredErr } = __.require('apiTests', 'utils/utils')
const { createItem, createItems } = require('../fixtures/items')

describe('items:get-by-ids', () => {
  it('should get an item by id', (done) => {
    createItem(getUser())
    .then(item => authReq('get', `/api/items?action=by-ids&ids=${item._id}`)
    .then((res) => {
      res.items[0]._id.should.equal(item._id)
      return done()
    })).catch(undesiredErr(done))

  })

  it('should get items by ids', (done) => {
    const emptyItemsData = [ {}, {}, {} ]
    createItems(getUser(), emptyItemsData)
    .then((items) => {
      const ids = _.map(items, '_id').sort()
      return authReq('get', `/api/items?action=by-ids&ids=${ids.join('|')}`)
      .then((res) => {
        const resIds = _.map(res.items, '_id').sort()
        resIds.should.deepEqual(ids)
        resIds.length.should.equal(ids.length)
        return done()
      })}).catch(undesiredErr(done))

  })

  return it('should include users if requested', (done) => {
    createItem(getUser())
    .then(item => authReq('get', `/api/items?action=by-ids&ids=${item._id}&include-users=true`)
    .then((res) => {
      res.items[0]._id.should.equal(item._id)
      res.users[0]._id.should.equal(item.owner)
      return done()
    })).catch(undesiredErr(done))

  })
})

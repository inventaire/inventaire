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
require('should')
const { getUser, getUserB, authReq, undesiredErr, undesiredRes } = __.require('apiTests', 'utils/utils')
const { createItem, createItems } = require('../fixtures/items')

describe('items:get-by-users', () => {
  it('should get an item by id', done => {
    createItem(getUser())
    .then(item => authReq('get', `/api/items?action=by-users&users=${item.owner}`)
    .then(res => {
      res.items[0]._id.should.equal(item._id)
      done()
    })).catch(undesiredErr(done))
  })

  it('should get items by ids', done => {
    Promise.all([
      createItem(getUser(), { listing: 'private' }),
      createItem(getUser(), { listing: 'public' }),
      createItem(getUserB(), { listing: 'public' })
    ])
    .then(items => {
      const usersIds = _.map(items.slice(1), 'owner')
      const itemsIds = _.map(items, '_id')
      return authReq('get', `/api/items?action=by-users&users=${usersIds.join('|')}`)
      .then(res => {
        const resUsersIds = _.uniq(_.map(res.items, 'owner'))
        resUsersIds.should.containDeep(usersIds)
        const resItemsIds = _.uniq(_.map(res.items, '_id'))
        resItemsIds.should.containDeep(itemsIds)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it("should get items by ids with a filter set to 'group'", done => {
    Promise.all([
      createItem(getUser(), { listing: 'private' }),
      createItem(getUser(), { listing: 'public' }),
      createItem(getUserB(), { listing: 'public' })
    ])
    .then(items => {
      const privateItemId = items[0]._id
      const usersIds = _.map(items.slice(1), 'owner')
      return authReq('get', `/api/items?action=by-users&users=${usersIds.join('|')}&filter=group`)
      .then(res => {
        const resUsersIds = _.uniq(_.map(res.items, 'owner'))
        resUsersIds.should.containDeep(usersIds)
        const resItemsIds = _.uniq(_.map(res.items, '_id'))
        resItemsIds.should.not.containEql(privateItemId)
        done()
      })
    })
    .catch(undesiredErr(done))
  })

  it("should reject invalid filters'", done => {
    getUser()
    .then(user => {
      const { _id: userId } = user
      return authReq('get', `/api/items?action=by-users&users=${userId}&filter=bla`)
    })
    .then(undesiredRes(done))
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('invalid filter')
      done()
    })
    .catch(undesiredErr(done))
  })
})

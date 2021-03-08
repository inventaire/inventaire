const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
require('should')
const { getUser, getUserB, authReq, undesiredRes } = require('apiTests/utils/utils')
const { createItem } = require('../fixtures/items')

describe('items:get-by-users', () => {
  it('should get an item by id', done => {
    createItem(getUser())
    .then(item => {
      return authReq('get', `/api/items?action=by-users&users=${item.owner}`)
      .then(res => {
        res.items[0]._id.should.equal(item._id)
        done()
      })
    })
    .catch(done)
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
    .catch(done)
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
    .catch(done)
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
    .catch(done)
  })
})

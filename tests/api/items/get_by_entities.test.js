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
const { getUser, authReq, undesiredErr } = __.require('apiTests', 'utils/utils')
const { createItem, createEditionAndItem } = require('../fixtures/items')

describe('items:get-by-entities', () => {
  it('should get an item by its entity uri', done => {
    createItem(getUser())
    .then(item => authReq('get', `/api/items?action=by-entities&uris=${item.entity}`)
    .then(res => {
      res.items[0].entity.should.equal(item.entity)
      done()
    })).catch(undesiredErr(done))
  })

  it('should get items by entities uris', done => {
    Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(getUser())
    ])
    .then(items => {
      const uris = _.uniq(_.map(items, 'entity'))
      _.log(uris, 'uris')
      return authReq('get', `/api/items?action=by-entities&uris=${uris.join('|')}`)
      .then(res => {
        const resUserIds = _.uniq(_.map(res.items, 'entity'))
        resUserIds.should.containDeep(uris)
        done()
      })
    })
    .catch(undesiredErr(done))
  })
})

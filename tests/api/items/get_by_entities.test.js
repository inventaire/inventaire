/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { getUser, getUserB, authReq, undesiredErr } = __.require('apiTests', 'utils/utils');
const { createItem, createEditionAndItem } = require('../fixtures/items');

describe('items:get-by-entities', function() {
  it('should get an item by its entity uri', function(done){
    createItem(getUser())
    .then(item => authReq('get', `/api/items?action=by-entities&uris=${item.entity}`)
    .then(function(res){
      res.items[0].entity.should.equal(item.entity);
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should get items by entities uris', function(done){
    Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(getUser())
    ])
    .then(function(items){
      const uris = _.uniq(_.map(items, 'entity'));
      _.log(uris, 'uris');
      return authReq('get', `/api/items?action=by-entities&uris=${uris.join('|')}`)
      .then(function(res){
        const resUserIds = _.uniq(_.map(res.items, 'entity'));
        resUserIds.should.containDeep(uris);
        return done();
      });}).catch(undesiredErr(done));

  });
});

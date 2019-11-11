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
const { createUser } = require('../fixtures/users');
const { Promise } = __.require('lib', 'promises');


const endpoint = '/api/items?action=by-user-and-entity';

describe('items:get-by-user-and-entity', function() {
  it('should get an item by its owner id and entity uri', function(done){
    createItem(getUser())
    .then(item => authReq('get', `${endpoint}&user=${item.owner}&uri=${item.entity}`)
    .then(function(res){
      const itemsIds = _.map(res.items, '_id');
      itemsIds.includes(item._id).should.be.true();
      for (let resItem of res.items) {
        resItem.entity.should.equal(item.entity);
        resItem.owner.should.equal(item.owner);
      }
      return done();
    })).catch(undesiredErr(done));

  });

  it('should get items by their owner id', function(done){
    Promise.all([
      createEditionAndItem(getUser()),
      createEditionAndItem(createUser())
    ])
    .spread(function(userItem){
      const { owner, entity: uri } = userItem;
      return authReq('get', `${endpoint}&user=${owner}&uri=${uri}`)
      .then(function(res){
        res.items.length.should.equal(1);
        res.items[0].should.deepEqual(userItem);
        return done();
      });}).catch(undesiredErr(done));

  });

  return it('should get items by their entity uri', function(done){
    createEditionAndItem(getUser())
    .then(function(itemA){
      const uri = itemA.entity;
      return createItem(getUser(), { entity: uri })
      .then(itemB => authReq('get', `${endpoint}&user=${itemA.owner}&uri=${uri}`)
      .then(function(res){
        const itemsIds = [ itemA._id, itemB._id ];
        const resItemsIds = _.map(res.items, '_id');
        resItemsIds.should.containDeep(itemsIds);
        return done();
      }));}).catch(undesiredErr(done));

  });
});

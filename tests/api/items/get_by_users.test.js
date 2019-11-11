/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { getUser, getUserB, authReq, undesiredErr, undesiredRes } = __.require('apiTests', 'utils/utils');
const { createItem, createItems } = require('../fixtures/items');

describe('items:get-by-users', function() {
  it('should get an item by id', function(done){
    createItem(getUser())
    .then(item => authReq('get', `/api/items?action=by-users&users=${item.owner}`)
    .then(function(res){
      res.items[0]._id.should.equal(item._id);
      return done();
    })).catch(undesiredErr(done));

  });

  it('should get items by ids', function(done){
    Promise.all([
      createItem(getUser(), { listing: 'private' }),
      createItem(getUser(), { listing: 'public' }),
      createItem(getUserB(), { listing: 'public' })
    ])
    .then(function(items){
      const usersIds = _.map(items.slice(1), 'owner');
      const itemsIds = _.map(items, '_id');
      return authReq('get', `/api/items?action=by-users&users=${usersIds.join('|')}`)
      .then(function(res){
        const resUsersIds = _.uniq(_.map(res.items, 'owner'));
        resUsersIds.should.containDeep(usersIds);
        const resItemsIds = _.uniq(_.map(res.items, '_id'));
        resItemsIds.should.containDeep(itemsIds);
        return done();
      });}).catch(undesiredErr(done));

  });

  it("should get items by ids with a filter set to 'group'", function(done){
    Promise.all([
      createItem(getUser(), { listing: 'private' }),
      createItem(getUser(), { listing: 'public' }),
      createItem(getUserB(), { listing: 'public' })
    ])
    .then(function(items){
      const privateItemId = items[0]._id;
      const usersIds = _.map(items.slice(1), 'owner');
      return authReq('get', `/api/items?action=by-users&users=${usersIds.join('|')}&filter=group`)
      .then(function(res){
        const resUsersIds = _.uniq(_.map(res.items, 'owner'));
        resUsersIds.should.containDeep(usersIds);
        const resItemsIds = _.uniq(_.map(res.items, '_id'));
        resItemsIds.should.not.containEql(privateItemId);
        return done();
      });}).catch(undesiredErr(done));

  });

  return it("should reject invalid filters'", function(done){
    getUser()
    .then(function(user){
      const { _id: userId } = user;
      return authReq('get', `/api/items?action=by-users&users=${userId}&filter=bla`);}).then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.startWith('invalid filter');
      return done();}).catch(undesiredErr(done));

  });
});

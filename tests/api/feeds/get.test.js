/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const { Promise } = __.require('lib', 'promises');
const should = require('should');
const { nonAuthReq, getUser, undesiredErr } = require('../utils/utils');
const { createItem } = require('../fixtures/items');

describe('feeds:get', function() {
  it('should return a user RSS feed', function(done){
    getUser()
    .then(function(user){
      const userId = user._id;
      return nonAuthReq('get', `/api/feeds?user=${userId}`)
      .then(function(res){
        res.startsWith('<?xml').should.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should return a user RSS feed when the user has an item', function(done){
    const userPromise = getUser();
    const itemPromise = createItem(userPromise);

    Promise.all([
      userPromise,
      itemPromise
    ])
    .spread(function(user, item){
      const userId = user._id;
      return nonAuthReq('get', `/api/feeds?user=${userId}`)
      .then(function(res){
        res.includes(item._id).should.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should not return private items when not authorized', function(done){
    const userPromise = getUser();
    const itemAPromise = createItem(userPromise, { listing: 'private' });
    const itemBPromise = createItem(userPromise, { listing: 'network' });

    Promise.all([
      userPromise,
      itemAPromise,
      itemBPromise
    ])
    .spread(function(user, itemA, itemB){
      const userId = user._id;
      return nonAuthReq('get', `/api/feeds?user=${userId}`)
      .then(function(res){
        res.startsWith('<?xml').should.be.true();
        res.includes(itemA._id).should.be.false();
        res.includes(itemB._id).should.be.false();
        return done();
      });}).catch(undesiredErr(done));

  });

  return it('should return private items when authorized', function(done){
    const userPromise = getUser();
    const itemAPromise = createItem(userPromise, { listing: 'private' });
    const itemBPromise = createItem(userPromise, { listing: 'network' });

    Promise.all([
      userPromise,
      itemAPromise,
      itemBPromise
    ])
    .spread(function(user, itemA, itemB){
      const { _id: userId, readToken: token } = user;
      return nonAuthReq('get', `/api/feeds?user=${userId}&requester=${userId}&token=${token}`)
      .then(function(res){
        res.startsWith('<?xml').should.be.true();
        res.includes(itemA._id).should.be.true();
        res.includes(itemB._id).should.be.true();
        return done();
      });}).catch(undesiredErr(done));

  });
});

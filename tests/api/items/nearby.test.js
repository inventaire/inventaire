/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { Promise } = __.require('lib', 'promises');
const { getUserGetter, customAuthReq, undesiredErr } = __.require('apiTests', 'utils/utils');
const { createItem } = require('../fixtures/items');
const geolocatedUser1Promise = getUserGetter('geo1', false, { position: [ 1, 1 ] })().delay(1000);
const geolocatedUser2Promise = getUserGetter('geo2', false, { position: [ 2, 2 ] })().delay(1000);
const endpoint = '/api/items?action=nearby';

describe('items:nearby', function() {
  it('should get items nearby', function(done){
    createItem(geolocatedUser1Promise)
    .delay(500)
    .then(item => customAuthReq(geolocatedUser2Promise, 'get', endpoint)
    .then(function(res){
      const itemsIds = _.map(res.items, '_id');
      itemsIds.includes(item._id).should.be.true();
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should accept a range', function(done){
    createItem(geolocatedUser1Promise)
    .delay(500)
    .then(item => customAuthReq(geolocatedUser2Promise, 'get', `${endpoint}&range=1&strict-range=true`)
    .then(function(res){
      const itemsIds = _.map(res.items, '_id');
      itemsIds.includes(item._id).should.be.false();
      return done();
    })).catch(undesiredErr(done));

  });
});

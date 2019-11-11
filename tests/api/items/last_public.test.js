/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, undesiredErr } = __.require('apiTests', 'utils/utils');
const { populate } = require('../fixtures/populate');
const lastPublicUrl = '/api/items?action=last-public';

describe('items:last-public', function() {
  it('can take an limit parameter', function(done){
    const limit = 2;
    populate({
      usersCount: 1,
      publicItemsPerUser: limit + 1}).then(() => nonAuthReq('get', lastPublicUrl + `&limit=${limit}`))
    .then(function(res){
      res.items.length.should.equal(limit);
      return done();}).catch(undesiredErr(done));

  });

  return it('should fetch 15 last-public items', function(done){
    populate({
      usersCount: 1,
      publicItemsPerUser: 16}).then(() => nonAuthReq('get', lastPublicUrl))
    .then(function(res){
      res.items.length.should.equal(15);
      return done();}).catch(undesiredErr(done));

  });
});

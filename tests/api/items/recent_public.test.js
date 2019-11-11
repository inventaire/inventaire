/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, undesiredRes, undesiredErr } = __.require('apiTests', 'utils/utils');
const { populate } = require('../fixtures/populate');
const recentPublicUrl = '/api/items?action=recent-public';

describe('items:recent-public', function() {
  it('should fetch 15 recent-public items', function(done){
    populate()
    .then(() => nonAuthReq('get', recentPublicUrl))
    .then(res => res.items.length.should.equal(15))
    .delay(10)
    .then(() => done())
    .catch(undesiredErr(done));
  });

  it('should fetch items from different owners', function(done){
    populate()
    .then(() => nonAuthReq('get', recentPublicUrl))
    .then(res => res.users.length.should.be.above(1))
    .delay(10)
    .then(() => done())
    .catch(undesiredErr(done));
  });

  it('should take a limit parameter', function(done){
    populate()
    .then(() => nonAuthReq('get', `${recentPublicUrl}&limit=3`))
    .then(res => res.items.length.should.equal(3))
    .delay(10)
    .then(() => done())
    .catch(undesiredErr(done));
  });

  it('should take a lang parameter', function(done){
    populate()
    .then(() => nonAuthReq('get', `${recentPublicUrl}&lang=en`))
    .then(res => _.some(res.items, itemLangIs('en')).should.be.true())
    .delay(10)
    .then(() => done())
    .catch(undesiredErr(done));
  });

  it('should return some of the most recent items', function(done){
    populate()
    .then(() => nonAuthReq('get', recentPublicUrl))
    .then(res => _.some(res.items, createdLately).should.be.true())
    .delay(10)
    .then(() => done())
    .catch(undesiredErr(done));
  });

  it('should reject invalid limit', function(done){
    nonAuthReq('get', `${recentPublicUrl}&limit=bla`)
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid limit: bla');
      return done();}).catch(undesiredErr(done));
  });

  return it('should reject invalid lang', function(done){
    nonAuthReq('get', `${recentPublicUrl}&lang=bla`)
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('invalid lang: bla');
      return done();}).catch(undesiredErr(done));
  });
});

var itemLangIs = lang => item => item.snapshot['entity:lang'] === lang;
var createdLately = item => !_.expired(item.created, 120000);

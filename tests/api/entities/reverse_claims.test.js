/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, undesiredErr, undesiredRes } = require('../utils/utils');

const buildUrl = function(property, value){
  let url;
  return url = _.buildPath('/api/entities', { action: 'reverse-claims', property, value });
};

describe('entities:reverse-claims', function() {
  it('should reject wdt:P31 requests', function(done){
    nonAuthReq('get', buildUrl('wdt:P31', 'wd:Q571'))
    .then(undesiredRes(done))
    .catch(function(err){
      err.body.status_verbose.should.equal('blacklisted property');
      return done();}).catch(undesiredErr(done));

  });

  it('should accept whitelisted entity value properties', function(done){
    nonAuthReq('get', buildUrl('wdt:P921', 'wd:Q456'))
    .then(function(res){
      res.uris.should.be.an.Array();
      return done();}).catch(undesiredErr(done));

  });

  return it('should accept whitelisted string value properties', function(done){
    nonAuthReq('get', buildUrl('wdt:P3035', '978-2-505'))
    .then(function(res){
      res.uris.should.be.an.Array();
      return done();}).catch(undesiredErr(done));

  });
});

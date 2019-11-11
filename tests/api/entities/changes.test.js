/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { nonAuthReq, undesiredErr } = require('../utils/utils');

describe('entities:changes', function() {
  it('should returns an array of changes', function(done){
    nonAuthReq('get', '/api/entities?action=changes')
    .then(function(res){
      res.uris.should.be.an.Array();
      res.lastSeq.should.be.an.Number();
      return done();}).catch(undesiredErr(done));

  });

  it('should take a since parameter', function(done){
    nonAuthReq('get', '/api/entities?action=changes&since=2')
    .then(function(res){
      res.uris.should.be.an.Array();
      res.lastSeq.should.be.an.Number();
      return done();}).catch(undesiredErr(done));

  });

  return it('should throw when passed an invalid since parameter', function(done){
    nonAuthReq('get', '/api/entities?action=changes&since=-2')
    .catch(function(err){
      err.body.error_name.should.equal('invalid_since');
      return done();}).catch(undesiredErr(done));

  });
});

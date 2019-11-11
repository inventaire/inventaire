/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { authReq, undesiredRes, undesiredErr } = require('../utils/utils');

const imageUrl = encodeURIComponent('https://raw.githubusercontent.com/inventaire/inventaire-client/master/app/assets/icon/32.png');
const dataUrlStart = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYA';

describe('images:data-url', function() {
  it('should reject a request without URL', function(done){
    authReq('get', '/api/images?action=data-url')
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('missing parameter in query: url');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject a request with an invalid URL', function(done){
    authReq('get', '/api/images?action=data-url&url=bla')
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid url: bla');
      return done();}).catch(undesiredErr(done));

  });

  it('should reject a request with an invalid content type', function(done){
    const invalidContentTypeUrl = encodeURIComponent('http://maxlath.eu/data.json');
    authReq('get', `/api/images?action=data-url&url=${invalidContentTypeUrl}`)
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.equal('invalid content type');
      return done();}).catch(undesiredErr(done));

  });
  return it('should return a data-url', function(done){
    authReq('get', `/api/images?action=data-url&url=${imageUrl}`)
    .then(function(res){
      res['data-url'].should.be.a.String();
      res['data-url'].should.startWith(dataUrlStart);
      return done();}).catch(undesiredErr(done));

  });
});

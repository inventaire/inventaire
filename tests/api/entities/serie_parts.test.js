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
const { createWorkWithAuthorAndSerie } = require('../fixtures/entities');
const workWithSeriePromise = createWorkWithAuthorAndSerie();

describe('entities:author-works', () => it('should get an authors works', function(done){
  workWithSeriePromise
  .then(function(work){
    const serieUri = work.claims['wdt:P179'][0];
    return nonAuthReq('get', `/api/entities?action=serie-parts&uri=${serieUri}`)
    .then(function(res){
      res.parts.should.be.an.Array();
      res.parts[0].should.be.an.Object();
      res.parts[0].uri.should.equal(`inv:${work._id}`);
      return done();
    });}).catch(undesiredErr(done));

}));

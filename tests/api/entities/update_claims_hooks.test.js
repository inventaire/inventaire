/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const promises_ = __.require('lib', 'promises');
const { undesiredErr } = require('../utils/utils');
const { getByUris, updateClaim } = require('../utils/entities');
const { createWork, createEditionFromWorks } = require('../fixtures/entities');

describe('entities:update-claims-hooks', function() {
  it('should update a work label from an edition title update if in sync', function(done){
    createWork()
    .then(work => createEditionFromWorks(work)
    .then(function(edition){
      const value = edition.claims['wdt:P1476'][0];
      const updatedValue = value + 'updated';
      return updateClaim(edition.uri, 'wdt:P1476', value, updatedValue)
      .delay(100)
      .then(() => getByUris(work.uri)
      .then(function(res){
        const refreshedWork = res.entities[work.uri];
        refreshedWork.labels.en.should.equal(updatedValue);
        return done();
      }));
    })).catch(undesiredErr(done));

  });

  return it('should not update a work label if editions disagree on the title', function(done){
    createWork()
    .then(work => promises_.all([
      createEditionFromWorks(work),
      createEditionFromWorks(work)
    ])
    .spread(function(editionA, editionB){
      const valueA = editionA.claims['wdt:P1476'][0];
      const updatedValueA = valueA + 'updated';
      return updateClaim(editionA.uri, 'wdt:P1476', valueA, updatedValueA)
      .delay(100)
      .then(() => getByUris(work.uri)
      .then(function(res){
        const refreshedWork = res.entities[work.uri];
        refreshedWork.labels.en.should.equal(work.labels.en);
        return done();
      }));
    })).catch(undesiredErr(done));

  });
});

/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { createEdition, createPublisher } = require('../../fixtures/entities');
const { updateClaim } = require('../../utils/entities');
const { undesiredErr } = require('../../utils/utils');

describe('entities:publishers:create', function() {
  it('should create a local publisher entity', function(done){
    createPublisher()
    .then(function(publisherDoc) {
      publisherDoc.type.should.equal('publisher');
      return done();}).catch(undesiredErr(done));

  });

  return it('should update an edition claim with a local publisher entity', function(done){
    createEdition()
    .then(function(edition){
      const editionUri = `inv:${edition._id}`;
      return createPublisher()
      .then(function(publisher){
        const oldVal = null;
        const newVal = `inv:${publisher._id}`;
        const property = 'wdt:P123';
        return updateClaim(editionUri, property, oldVal, newVal)
        .then(res => done());
      });}).catch(undesiredErr(done));

  });
});

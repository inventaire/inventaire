/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { undesiredRes, undesiredErr } = require('../../utils/utils');
const { updateLabel } = require('../../utils/entities');
const { createEdition, randomLabel } = require('../../fixtures/entities');

describe('entities:editions:update-labels', () => it('should reject labels update', function(done){
  createEdition()
  .then(edition => updateLabel(edition._id, 'fr', randomLabel())
  .then(undesiredRes(done))
  .catch(function(err){
    err.body.status_verbose.should.equal("editions can't have labels");
    err.statusCode.should.equal(400);
    return done();
  })).catch(undesiredErr(done));

}));

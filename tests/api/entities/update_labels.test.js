/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { undesiredRes, undesiredErr } = require('../utils/utils');
const { createHuman } = require('../fixtures/entities');
const { getByUri, updateLabel } = require('../utils/entities');

const humanPromise = createHuman();

describe('entities:update-labels', function() {
  it('should update a label', function(done){
    humanPromise
    .then(function(human){
      const { uri } = human;
      return updateLabel(human._id, 'fr', 'foo')
      .then(() => getByUri(human.uri))
      .then(function(updatedHuman){
        updatedHuman.labels.fr.should.equal('foo');
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should reject an update with an invalid lang', function(done){
    humanPromise
    .then(human => updateLabel(human._id, 'zz', 'foo'))
      .then(undesiredRes(done))
      .catch(function(err){
        err.statusCode.should.equal(400);
        err.body.status_verbose.should.startWith('invalid lang');
        return done();}).catch(undesiredErr(done));

  });

  it('should reject an update with an invalid value', function(done){
    humanPromise
    .then(human => updateLabel(human._id, 'en', 123))
      .then(undesiredRes(done))
      .catch(function(err){
        err.statusCode.should.equal(400);
        err.body.status_verbose.should.startWith('invalid value');
        return done();}).catch(undesiredErr(done));

  });

  it('should reject an up-to-date value', function(done){
    humanPromise
    .then(human => updateLabel(human._id, 'en', 'foo')
    .catch(undesiredErr(done))
    .then(() => updateLabel(human._id, 'en', 'foo'))
    .then(undesiredRes(done))
    .catch(function(err){
      err.statusCode.should.equal(400);
      err.body.status_verbose.should.startWith('already up-to-date');
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should accept rapid updates on the same entity', function(done){
    const name = 'Georges';
    const langs = [ 'en', 'fr' ];
    humanPromise
    .then(function(human){
      const { _id: humanId, uri: humanUri } = human;
      return Promise.all(langs.map(lang => updateLabel(humanId, lang, name)))
      .then(function(responses){
        responses.forEach(res => should(res.ok).be.true());
        return getByUri(human.uri)
        .then(function(updatedHuman){
          langs.forEach(lang => updatedHuman.labels[lang].should.equal(name));
          return done();
        });
      });}).catch(undesiredErr(done));

  });
});

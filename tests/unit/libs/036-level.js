/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath;
const _ = __.require('builders', 'utils');

const should = require('should');
const { Promise } = __.require('lib', 'promises');
const { undesiredRes } = require('../utils');

const levelBase = __.require('level', 'base');
const db = levelBase.simpleSubDb('test db');

describe('simplified level', function() {
  it('should put and get an object value', function(done){
    db.put('ohoh', { ahoy: 'georges' })
    .then(() => db.get('ohoh'))
    .then(function(res){
      res.should.be.an.Object();
      res.ahoy.should.equal('georges');
      return done();}).catch(done);

  });

  it('should batch and reset', function(done){
    db.reset()
    .then(() => db.batch([
      { key: 'a', value: 'b' },
      { key: 'c', value: 'd' },
      { key: 'e', value: { f: 1 } },
      { key: 'g', value: 'h' }
    ]))
    .then(() => db.batch([
      { type: 'del', key: 'c' },
      { type: 'del', key: 'g' },
      { type: 'put', key: 'i', value: 'j' }
    ]))
    .then(() => levelBase.streamPromise(db.sub.createReadStream()))
    .then(function(dump){
      dump.should.deepEqual([
        { key: 'a', value: 'b' },
        { key: 'e', value: { f: 1 } },
        { key: 'i', value: 'j' }
      ]);
      return done();
    });

  });

  it('should put and get a string value', function(done){
    db.put('what', 'zup')
    .then(() => db.get('what'))
    .then(function(res){
      res.should.equal('zup');
      return done();}).catch(done);

  });

  return it('should catch notFound errors', function(done){
    let spyCount = 0;
    db.get('not defined')
    .catch(function(err){
      _.error(err, 'GET err');
      return spyCount++;}).then(function(res){
      spyCount.should.equal(0);
      should(res).not.be.ok();
      return done();}).catch(done);

  });
});

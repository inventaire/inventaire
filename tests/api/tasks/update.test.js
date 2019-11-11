/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { createHuman } = require('../fixtures/entities');
const { update, checkEntities } = require('../utils/tasks');

// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:update', function() {
  it('should update a task', function(done){
    createHuman({ labels: { en: 'Fred Vargas' } })
    .then(human => checkEntities(human.uri))
    .then(function(tasks){
      const task = tasks[0];
      return update(task._id, 'state', 'dismissed')
      .then(function(updatedTask){
        updatedTask[0].ok.should.be.true();
        return done();
      });}).catch(done);

  });

  return it('should throw if invalid task id', function(done){
    update('')
    .catch(function(err){
      err.body.status_verbose.should.be.a.String();
      return done();}).catch(done);

  });
});

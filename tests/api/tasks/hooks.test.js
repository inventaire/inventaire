/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { Promise } = __.require('lib', 'promises');
const { merge } = require('../utils/entities');
const { createHuman, createWorkWithAuthor } = require('../fixtures/entities');
const { deleteByUris: deleteEntityByUris } = require('../utils/entities');
const { getByIds, getBySuspectUri, update, checkEntities } = require('../utils/tasks');

// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:hooks', function() {
  describe('entity merge', function() {
    it('should update same suspect tasks to merged state', function(done){
      // Alexander Kennedy is expected to have several merge suggestions
      createHuman({ labels: { en: 'Alexander Kennedy' } })
      .then(human => checkEntities(human.uri))
      .then(function(tasks){
        const task = tasks[0];
        const anotherTask = tasks[1];
        return merge(task.suspectUri, task.suggestionUri)
        .delay(100)
        .then(() => getByIds(anotherTask._id))
        .then(function(tasks){
          const updatedTask = tasks[0];
          updatedTask.state.should.equal('merged');
          return done();
        });}).catch(done);

    });

    it('should update task state to merged', function(done){
      createHuman({ labels: { en: 'Fred Vargas' } })
      .then(human => checkEntities(human.uri))
      .then(function(tasks){
        const task = tasks[0];
        return merge(task.suspectUri, task.suggestionUri)
        .delay(100)
        .then(() => getByIds(task._id))
        .then(function(tasks){
          const updatedTask = tasks[0];
          updatedTask.state.should.equal('merged');
          return done();
        });}).catch(done);

    });

    return it('should update relationScore of tasks with same suspect', function(done){
      // John Smith is expected to have several merge suggestions
      createHuman({ labels: { en: 'John Smith' } })
      .then(human => checkEntities(human.uri))
      .then(function(tasks){
        const taskToUpdate = tasks[0];
        const otherTask = tasks[1];
        const { relationScore: taskRelationScore } = taskToUpdate;
        return update(taskToUpdate._id, 'state', 'dismissed')
        .delay(100)
        .then(() => getByIds(otherTask._id))
        .then(function(tasks){
          const updatedTask = tasks[0];
          updatedTask.relationScore.should.not.equal(taskRelationScore);
          return done();
        });}).catch(done);

    });
  });

  return describe('entity removed', function() {
    it('should update tasks to merged state when the entity is deleted', function(done) {
      createHuman({ labels: { en: 'Fred Vargas' } })
      .then(human => checkEntities(human.uri)
      .then(function(tasks){
        tasks.length.should.be.aboveOrEqual(1);
        return deleteEntityByUris(human.uri);}).then(() => getBySuspectUri(human.uri))).then(function(tasks){
        tasks.length.should.equal(0);
        return done();}).catch(done);

    });

    return it('should update tasks to merged state when an entity is deleted as a removed placeholder', function(done) {
      Promise.all([
        createHuman({ labels: { en: 'Fred Vargas' } }),
        createHuman({ labels: { en: 'Fred Vargas' } })
      ])
      .spread((humanA, humanB) => Promise.all([
        createWorkWithAuthor(humanA),
        createWorkWithAuthor(humanB),
        checkEntities(humanA.uri),
        checkEntities(humanB.uri)
      ])
      .delay(100)
      .spread(function(workA, workB, tasksA, tasksB){
        tasksA.length.should.be.aboveOrEqual(1);
        tasksB.length.should.be.aboveOrEqual(1);
        return merge(workA.uri, workB.uri)
        .delay(100)
        .then(() => getByIds(tasksA[0]._id))
        .then(function(remainingTasks){
          remainingTasks[0].state.should.equal('merged');
          return done();
        });
      })).catch(done);

    });
  });
});

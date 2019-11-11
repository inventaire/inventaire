/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config');
const __ = CONFIG.universalPath;
const _ = __.require('builders', 'utils');
const should = require('should');
const { undesiredErr } = __.require('apiTests', 'utils/utils');
const { createSomeTasks } = require('../fixtures/tasks');
const { createHuman, createWorkWithAuthor } = require('../fixtures/entities');
const { getByScore, getBySuspectUris, getBySuggestionUris, update, checkEntities } = require('../utils/tasks');

// Tests dependency: having a populated ElasticSearch wikidata index
describe('tasks:byScore', function() {
  it('should returns 10 or less tasks to deduplicates, by default', function(done){
    createSomeTasks('Gilbert Simondon')
    .then(getByScore)
    .then(function(tasks){
      tasks.length.should.be.belowOrEqual(10);
      tasks.length.should.be.aboveOrEqual(1);
      return done();}).catch(undesiredErr(done));

  });

  it('should returns a limited array of tasks to deduplicate', function(done){
    createSomeTasks('Gilbert Simondon')
    .then(() => getByScore({ limit: 1 }))
    .then(function(tasks){
      tasks.length.should.equal(1);
      return done();}).catch(undesiredErr(done));

  });

  it('should take an offset parameter', function(done){
    createSomeTasks('Gilbert Simondon')
    .then(getByScore)
    .then(tasksA => getByScore({ offset: 1 })
    .then(function(tasksB){
      tasksA[1].should.deepEqual(tasksB[0]);
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should return tasks in the right order', function(done){
    const humanLabel = 'Stanislas Lem'; // has no homonyms
    const workLabel = 'Solaris'; // too short label to be automerged
    createSomeTasks('Gilbert Simondon')
    .then(() => createHuman({ labels: { en: humanLabel } }))
    .then(human => createWorkWithAuthor(human, workLabel)
    .then(work => checkEntities(human.uri))
    .then(() => getByScore())
    .then(function(tasks){
      tasks.forEach(function(task, i){
        const previousTask = tasks[i-1];
        if (previousTask == null) { return; }
        const prevOccurrencesCount = previousTask.externalSourcesOccurrences.length;
        const occurrencesCount = task.externalSourcesOccurrences.length;
        return prevOccurrencesCount.should.be.aboveOrEqual(occurrencesCount);
      });
      return done();
    })).catch(undesiredErr(done));

  });
});

describe('tasks:bySuspectUris', function() {
  it('should return an array of tasks', function(done){
    createSomeTasks('Gilbert Simondon')
    .then(function(res){
      const { uri } = res.humans[0];
      return getBySuspectUris(uri)
      .then(function(tasks){
        tasks.should.be.an.Object();
        Object.keys(tasks).length.should.equal(1);
        tasks[uri].should.be.an.Array();
        tasks[uri][0].should.be.an.Object();
        return done();
      });}).catch(undesiredErr(done));

  });

  it('should not return archived tasks', function(done){
    createSomeTasks('Gilbert Simondon')
    .then(function(res){
      const task = res.tasks[0];
      const { suspectUri } = task;
      return update(task._id, 'state', 'dismissed')
      .then(() => getBySuspectUris(suspectUri))
      .then(function(tasks){
        tasks[suspectUri].length.should.equal(0);
        return done();
      });}).catch(undesiredErr(done));

  });

  return it('should return an array of tasks even when no tasks is found', function(done){
    const fakeUri = 'inv:00000000000000000000000000000000';
    getBySuspectUris(fakeUri)
    .then(function(tasks){
      tasks.should.be.an.Object();
      Object.keys(tasks).length.should.equal(1);
      tasks[fakeUri].should.be.an.Array();
      tasks[fakeUri].length.should.equal(0);
      return done();}).catch(undesiredErr(done));

  });
});

describe('tasks:bySuggestionUris', function() {
  it('should return an array of tasks', function(done){
    const uri = 'wd:Q1345582';
    createSomeTasks('Gilbert Simondon')
    .then(res => getBySuggestionUris(uri)
    .then(function(tasks){
      tasks.should.be.an.Object();
      Object.keys(tasks).length.should.equal(1);
      tasks[uri].should.be.an.Array();
      tasks[uri][0].should.be.an.Object();
      return done();
    })).catch(undesiredErr(done));

  });

  return it('should return an array of tasks even when no tasks is found', function(done){
    const uri = 'wd:Q32193244';
    getBySuggestionUris(uri)
    .then(function(tasks){
      tasks.should.be.an.Object();
      Object.keys(tasks).length.should.equal(1);
      tasks[uri].should.be.an.Array();
      tasks[uri].length.should.equal(0);
      return done();}).catch(undesiredErr(done));

  });
});

const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
require('should')
const { checkEntities, getBySuspectUri } = require('../utils/tasks')
const { undesiredRes } = __.require('apiTests', 'utils/utils')
const { getByUris } = require('../utils/entities')
const { createHuman, createWork } = require('../fixtures/entities')

// Tests dependency: having a populated Elasticsearch wikidata index
describe('tasks:check-entities', () => {
  it('should refuse to check entities of non-allowlisted types', done => {
    // Currently, only humans can be checked for duplicates,
    // or at least are the entrypoint for duplicate checks
    createWork()
    .then(work => {
      return checkEntities(work.uri)
      .then(undesiredRes(done))
      .catch(err => {
        err.statusCode.should.equal(400)
        err.body.status_verbose.should.equal('unsupported type: work')
        done()
      })
    })
    .catch(done)
  })

  it('should create tasks for the requested URIs', done => {
    createHuman({ labels: { en: 'Fred Vargas' } })
    .then(human => {
      return checkEntities(human.uri)
      .then(tasks => {
        tasks.should.be.an.Array()
        const task = tasks[0]
        task.suspectUri.should.equal(human.uri)
        task.type.should.equal('deduplicate')
        task.suggestionUri.should.startWith('wd')
        task.lexicalScore.should.be.a.Number()
        task.relationScore.should.be.a.Number()
        task.externalSourcesOccurrences.should.be.an.Array()
        done()
      })
    })
    .catch(done)
  })

  it('should not re-create existing tasks', done => {
    createHuman({ labels: { en: 'Fred Vargas' } })
    .then(human => {
      return checkEntities(human.uri)
      .then(() => checkEntities(human.uri))
      .then(() => getBySuspectUri(human.uri))
    })
    .then(tasks => {
      const uniqSuggestiontUris = _.uniq(_.map(tasks, 'suggestionUri'))
      tasks.length.should.equal(uniqSuggestiontUris.length)
      done()
    })
    .catch(done)
  })
})

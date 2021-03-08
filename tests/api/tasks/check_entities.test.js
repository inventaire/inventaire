const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = require('builders/utils')
require('should')
const { checkEntities, getBySuspectUri } = require('../utils/tasks')
const { findOrIndexEntities } = require('../utils/entities')
const { createHuman, createWork } = require('../fixtures/entities')
const { shouldNotBeCalled } = require('apiTests/utils/utils')

describe('tasks:check-entities', () => {
  before(async () => {
    const wikidataUris = [ 'wd:Q237087' ]
    await findOrIndexEntities(wikidataUris)
  })
  it('should refuse to check entities of non-allowlisted types', async () => {
    // Currently, only humans can be checked for duplicates,
    // or at least are the entrypoint for duplicate checks
    const work = await createWork()
    await checkEntities(work.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('unsupported type: work')
    })
  })

  it('should create tasks for the requested URIs', async () => {
    const human = await createHuman({ labels: { en: 'Fred Vargas' } })
    const tasks = await checkEntities(human.uri)
    tasks.should.be.an.Array()
    const task = tasks[0]
    task.suspectUri.should.equal(human.uri)
    task.type.should.equal('deduplicate')
    task.entitiesType.should.equal(human.type)
    task.suggestionUri.should.startWith('wd')
    task.lexicalScore.should.be.a.Number()
    task.relationScore.should.be.a.Number()
    task.externalSourcesOccurrences.should.be.an.Array()
  })

  it('should not re-create existing tasks', async () => {
    const human = await createHuman({ labels: { en: 'Fred Vargas' } })
    await checkEntities(human.uri)
    await checkEntities(human.uri)
    const tasks = await getBySuspectUri(human.uri)
    const uniqSuggestiontUris = _.uniq(_.map(tasks, 'suggestionUri'))
    tasks.length.should.equal(uniqSuggestiontUris.length)
  })
})

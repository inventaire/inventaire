const _ = require('builders/utils')
require('should')
const { createWork, generateIsbn13h, createEditionWithIsbn, createHuman } = require('../fixtures/entities')
const { getByUris, getByUri } = require('../utils/entities')
const { authReq, rethrowShouldNotBeCalledErrors, getUser, shouldNotBeCalled } = require('tests/api/utils/utils')
const { getBySuspectUri } = require('../utils/tasks')
const { wait } = require('lib/promises')
const endpoint = '/api/tasks?action=deduplicate-works'

describe('tasks:deduplicate:works', () => {
  it('should reject to without a uri', async () => {
    try {
      await authReq('post', endpoint)
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in body: uri')
    }
  })

  it('should reject to without isbn', async () => {
    try {
      await authReq('post', endpoint, { uri: 'inv:00000000000000000000000000000000' })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in body: isbn')
    }
  })

  it('should reject wrong entity type', async () => {
    const human = await createHuman()
    const uri = human.uri
    const isbn = generateIsbn13h()
    try {
      await authReq('post', endpoint, { uri, isbn })
      .then(shouldNotBeCalled)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('unsupported type')
    }
  })

  it('should create task from a work uri and an isbn', async () => {
    // task is created because work labels and edition work labels have nothing in common, then no automerge possible
    const work = await createWork()
    const uri = work.uri
    const edition = await createEditionWithIsbn()
    const editionWorkUri = edition.claims['wdt:P629'][0]
    const isbn = edition.isbn

    const res = await authReq('post', endpoint, { uri, isbn })
    res.tasks[0].ok.should.equal(true)
    const suspectUriTasksRes = await getBySuspectUri(uri)
    const newTask = Object.values(suspectUriTasksRes)[0]

    newTask.entitiesType.should.equal('work')
    newTask.suggestionUri.should.equal(editionWorkUri)
    const user = await getUser()
    newTask.reporter.should.equal(user._id)
    newTask.clue.should.equal(isbn)
  })

  it('should automerge if labels exact match', async () => {
    const edition = await createEditionWithIsbn()
    const editionWorkUri = edition.claims['wdt:P629'][0]
    const editionWork = await getByUri(editionWorkUri)
    const editionWorkTitle = editionWork.labels.en
    const isbn = edition.isbn

    const work = await createWork({ labels: { zh: editionWorkTitle } })
    const workUri = work.uri

    await authReq('post', endpoint, { uri: workUri, isbn })
    await wait(100)

    const res = await getByUris(workUri)
    // work should have merged into editionWork
    res.entities[editionWorkUri].should.be.ok()
  })

  it('should not automerge if labels almost match', async () => {
    const edition = await createEditionWithIsbn()
    const editionWorkUri = edition.claims['wdt:P629'][0]
    const editionWork = await getByUri(editionWorkUri)
    const editionWorkTitle = editionWork.labels.en
    const isbn = edition.isbn

    const work = await createWork({ labels: { zh: editionWorkTitle + 'zzz' } })
    const workUri = work.uri

    await authReq('post', endpoint, { uri: workUri, isbn })
    await wait(100)

    const res = await getByUris(workUri)
    res.entities[workUri].should.be.ok()
  })

  it('should not re-create existing tasks', async () => {
    const work = await createWork()
    const uri = work.uri
    const edition = await createEditionWithIsbn()
    const isbn = edition.isbn

    await authReq('post', endpoint, { uri, isbn })
    await wait(100)
    await authReq('post', endpoint, { uri, isbn })
    await wait(100)
    const tasks = await getBySuspectUri(uri)
    const uniqSuggestiontUris = _.uniq(_.map(tasks, 'suggestionUri'))
    tasks.length.should.equal(uniqSuggestiontUris.length)
  })
})

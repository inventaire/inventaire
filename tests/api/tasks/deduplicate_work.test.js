const CONFIG = require('config')
const __ = CONFIG.universalPath
require('should')
const { createWork, generateIsbn13h, createEditionWithIsbn, createHuman } = require('../fixtures/entities')
const { getByUris, getByUri } = require('../utils/entities')
const { adminReq, rethrowShouldNotBeCalledErrors } = __.require('apiTests', 'utils/utils')
const { getBySuspectUris } = require('../utils/tasks')
const { wait } = __.require('lib', 'promises')
const endpoint = '/api/tasks?action='

describe('tasks:deduplicate:work', () => {
  it('should reject to without uris', async () => {
    try {
      await adminReq('post', `${endpoint}deduplicate-work`)
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in body: uri')
    }
  })

  it('should reject to without isbn', async () => {
    try {
      await adminReq('post', `${endpoint}deduplicate-work`, { uri: 'inv:00000000000000000000000000000000' })
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal('missing parameter in body: isbn')
    }
  })

  it('should reject unsupported entity type', async () => {
    const human = await createHuman()
    const uri = human.uri
    const isbn = generateIsbn13h()
    try {
      await adminReq('post', `${endpoint}deduplicate-work`, { uri, isbn })
    } catch (err) {
      rethrowShouldNotBeCalledErrors(err)
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.startWith('unsupported type')
    }
  })

  it('should create feedback task from a work uri and an isbn', async () => {
    // task is created because work labels and edition work labels have nothing in common, then no automerge possible
    const work = await createWork()
    const uri = work.uri
    const edition = await createEditionWithIsbn()
    const editionWorkUri = edition.claims['wdt:P629'][0]
    const isbn = edition.isbn
    const res = await adminReq('post', `${endpoint}deduplicate-work`, { uri, isbn })
    res.tasks[0].ok.should.equal(true)
    const suspectUriTasksRes = await getBySuspectUris(uri)
    const newTask = Object.values(suspectUriTasksRes)[0][0]
    newTask.suggestionUri.should.equal(editionWorkUri)
  })

  it('should automerge if labels exact match', async () => {
    const edition = await createEditionWithIsbn()
    const editionWorkUri = edition.claims['wdt:P629'][0]
    const editionWork = await getByUri(editionWorkUri)
    const editionWorkTitle = editionWork.labels.en
    const isbn = edition.isbn

    const work = await createWork({ labels: { zh: editionWorkTitle } })
    const workUri = work.uri

    await adminReq('post', `${endpoint}deduplicate-work`, { uri: workUri, isbn })
    await wait(100)

    const res = await getByUris(workUri)
    // work should have merged into editionWork
    res.entities[editionWorkUri].should.be.ok()
  })
})

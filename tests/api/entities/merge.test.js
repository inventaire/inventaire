require('should')
const { publicReq, dataadminReq, shouldNotBeCalled, getUser, getUserB } = require('../utils/utils')
const randomString = require('lib/utils/random_string')
const { getByUris, merge, getHistory, addClaim } = require('../utils/entities')
const { getItemsByIds } = require('../utils/items')
const { createWork, createHuman, createEdition, createEditionWithIsbn, createItemFromEntityUri, createWorkWithAuthor, someFakeUri } = require('../fixtures/entities')

describe('entities:merge', () => {
  it('should require to be authentified', async () => {
    await publicReq('put', '/api/entities?action=merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(401)
    })
  })

  it('should reject without from uri', async () => {
    await dataadminReq('put', '/api/entities?action=merge')
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: from')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject without to uri', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: someFakeUri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal('missing parameter in body: to')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid uris', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: 'fromUri', to: 'toUri' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith('invalid from:')
      err.statusCode.should.equal(400)
    })
  })

  it('should reject invalid from prefix', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: 'wd:Q42', to: someFakeUri })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.startWith("invalid 'from' uri domain: wd. Accepted domains: inv,isbn")
      err.statusCode.should.equal(400)
    })
  })

  it('should return uris not found', async () => {
    await dataadminReq('put', '/api/entities?action=merge', { from: someFakeUri, to: 'wd:Q42' })
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("'from' entity not found")
      err.statusCode.should.equal(400)
    })
  })

  it('should merge two entities with an inv URI', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    await shouldBeMerged(workA, workB)
  })

  it('should merge entities with inv and isbn URIs', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEdition(),
      createEditionWithIsbn()
    ])
    const item = await createItemFromEntityUri({ uri: editionA.uri })
    item.entity.should.equal(editionA.uri)
    await merge(editionA.uri, editionB.uri)
    await shouldBeMerged(editionA, editionB, item)
  })

  it('should merge an entity with an ISBN', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEdition()
    ])
    const item = await createItemFromEntityUri({ uri: editionB.uri })
    await merge(editionA.uri, editionB.uri)
    const [ { entities, redirects }, { items } ] = await Promise.all([
      getByUris(editionB.uri),
      getItemsByIds(item._id)
    ])
    const updatedEditionB = entities[redirects[editionB.uri]]
    updatedEditionB.claims['wdt:P212'].should.deepEqual(editionA.claims['wdt:P212'])
    const isbnUri = editionA.uri
    items[0].entity.should.equal(isbnUri)
  })

  it('should reject merge with different ISBNs', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEditionWithIsbn()
    ])
    await merge(editionA.uri, editionB.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.body.status_verbose.should.equal("can't merge editions with different ISBNs")
      err.statusCode.should.equal(400)
    })
  })

  it('should transfer claims', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await addClaim({ uri: workA.uri, property: 'wdt:P50', value: 'wd:Q535' })
    await merge(workA.uri, workB.uri)
    const { entities } = await getByUris(workB.uri)
    const authorsUris = entities[workB.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ 'wd:Q535' ])
  })

  it('should transfer labels', async () => {
    const label = randomString(6)
    const [ workA, workB ] = await Promise.all([
      createWork({ labels: { zh: label } }),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    const { entities } = await getByUris(workB.uri)
    entities[workB.uri].labels.zh.should.equal(label)
  })

  it('should keep track of the patch context', async () => {
    const [ workA, workB ] = await Promise.all([
      createWork(),
      createWork()
    ])
    await addClaim({ uri: workA.uri, property: 'wdt:P50', value: 'wd:Q535' })
    await merge(workA.uri, workB.uri)
    const patches = await getHistory(workB._id)
    patches[1].context.mergeFrom.should.equal(workA.uri)
  })

  it('should redirect claims', async () => {
    const [ humanA, humanB, work ] = await Promise.all([
      createHuman(),
      createHuman(),
      createWork()
    ])
    await addClaim({ uri: work.uri, property: 'wdt:P50', value: humanA.uri })
    await merge(humanA.uri, humanB.uri)
    const { entities } = await getByUris(work.uri)
    const authorsUris = entities[work.uri].claims['wdt:P50']
    authorsUris.should.deepEqual([ humanB.uri ])
    const patches = await getHistory(work._id)
    // patch 0: create the work entity
    // patch 1: add a wdt:P50 claim pointing to to humanA
    // patch 2: redirect to humanB
    patches[2].context.redirectClaims.should.deepEqual({ fromUri: humanA.uri })
  })

  it('should reject a merge from a redirection', async () => {
    const [ workA, workB, workC ] = await Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    await merge(workA.uri, workC.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("'from' entity is already a redirection")
    })
  })

  it('should reject a merge to a redirection', async () => {
    const [ workA, workB, workC ] = await Promise.all([
      createWork(),
      createWork(),
      createWork()
    ])
    await merge(workA.uri, workB.uri)
    await merge(workC.uri, workA.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("'to' entity is already a redirection")
    })
  })

  it('should reject a circular merge', async () => {
    const work = await createWork()
    await merge(work.uri, work.uri)
    .then(shouldNotBeCalled)
    .catch(err => {
      err.statusCode.should.equal(400)
      err.body.status_verbose.should.equal("can't merge an entity into itself")
    })
  })

  it('should remove isolated human "placeholders" entities on works merge', async () => {
    const [ workA, workB ] = await Promise.all([
      createWorkWithAuthor(),
      createWorkWithAuthor()
    ])
    const humanAUri = workA.claims['wdt:P50'][0]
    await merge(workA.uri, workB.uri)
    const { entities } = await getByUris(humanAUri)
    const entity = entities[humanAUri]
    entity._meta_type.should.equal('removed:placeholder')
  })

  it('should merge an entity with a non-canonical uri', async () => {
    const [ editionA, editionB ] = await Promise.all([
      createEditionWithIsbn(),
      createEdition()
    ])
    editionA.uri.should.startWith('isbn')
    await merge(`inv:${editionA._id}`, editionB.uri)
  })

  describe('non-dataadmin', () => {
    it('should create a merge request task', async () => {
      const [ editionA, editionB ] = await Promise.all([
        createEdition(),
        createEdition()
      ])
      const { task, merged } = await merge(editionA.uri, editionB.uri, { user: getUser() })
      task.should.be.an.Object()
      task.suspectUri.should.equal(editionA.uri)
      task.suggestionUri.should.equal(editionB.uri)
      merged.should.be.false()
    })

    it('should reuse an existing task when the same user is requesting the same merge', async () => {
      const [ editionA, editionB ] = await Promise.all([
        createEdition(),
        createEdition()
      ])
      const user = await getUser()
      const { task: taskA } = await merge(editionA.uri, editionB.uri, { user })
      const { task: taskB } = await merge(editionA.uri, editionB.uri, { user })
      taskA._id.should.equal(taskB._id)
      taskB.reporters.should.deepEqual([ user._id ])
    })

    it('should reuse an existing task when another user is requesting the same merge', async () => {
      const [ editionA, editionB ] = await Promise.all([
        createEdition(),
        createEdition()
      ])
      const [ userA, userB ] = await Promise.all([ getUser(), getUserB() ])
      const { task: taskA } = await merge(editionA.uri, editionB.uri, { user: userA })
      const { task: taskB } = await merge(editionA.uri, editionB.uri, { user: userB })
      taskA._id.should.equal(taskB._id)
      taskB.reporters.should.deepEqual([ userA._id, userB._id ])
    })
  })
})

const shouldBeMerged = async (entityA, entityB, item) => {
  const { entities, redirects } = await getByUris(entityA.uri)
  redirects[entityA.uri].should.equal(entityB.uri)
  entities[entityB.uri].should.be.ok()
  if (item) {
    const { items } = await getItemsByIds(item._id)
    items[0].entity.should.equal(entityB.uri)
  }
}

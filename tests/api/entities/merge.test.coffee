CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ undesiredErr, undesiredRes } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ getByUris, merge, getHistory, addClaim } = require '../utils/entities'
{ getByIds: getItemsByIds } = require '../utils/items'
{ createWork, createHuman, createEdition, ensureEditionExists, createItemFromEntityUri } = require '../fixtures/entities'

describe 'entities:merge', ->
  it 'should merge two entities with an inv URI', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      merge workA.uri, workB.uri
      .then -> getByUris workA.uri
      .then (res)->
        res.redirects[workA.uri].should.equal workB.uri
        res.entities[workB.uri].should.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should merge entities with inv and isbn URIs', (done)->
    Promise.all [
      createEdition()
      ensureEditionExists 'isbn:9782298063264'
    ]
    .spread (editionA, editionB)->
      createItemFromEntityUri editionA.uri
      .then (item)->
        item.entity.should.equal editionA.uri
        merge editionA.uri, editionB.uri
        .then ->
          Promise.all [
            getByUris editionA.uri
            getItemsByIds item._id
          ]
        .spread (entitiesRes, itemsRes)->
          entitiesRes.redirects[editionA.uri].should.equal editionB.uri
          entitiesRes.entities[editionB.uri].should.be.ok()
          itemsRes.items[0].entity.should.equal editionB.uri
          done()
    .catch undesiredErr(done)

    return

  it 'should merge an entity with an ISBN', (done)->
    Promise.all [
      ensureEditionExists 'isbn:9782298063264'
      createEdition()
    ]
    .spread (editionA, editionB)->
      createItemFromEntityUri editionB.uri
      .then (item)->
        merge editionA.uri, editionB.uri
        .then ->
          Promise.all [
            getByUris editionB.uri
            getItemsByIds item._id
          ]
        .spread (entitiesRes, itemsRes)->
          { entities, redirects } = entitiesRes
          updatedEditionB = entities[redirects[editionB.uri]]
          updatedEditionB.claims['wdt:P212']
          .should.deepEqual editionA.claims['wdt:P212']
          isbnUri = editionA.uri
          itemsRes.items[0].entity.should.equal isbnUri
          done()
    .catch undesiredErr(done)

    return

  it 'should reject merge with different ISBNs', (done)->
    Promise.all [
      ensureEditionExists 'isbn:9782298063264'
      ensureEditionExists 'isbn:9782211225915'
    ]
    .spread (editionA, editionB)->
      editionAInvUri = 'inv:' + editionA._id
      editionBInvUri = 'inv:' + editionB._id
      merge editionAInvUri, editionBInvUri
      .then undesiredRes(done)
      .catch (err)->
        # That's not a very specific error report, but it does the job
        # of blocking a merge from an edition with an ISBN
        err.body.status_verbose
        .should.equal "can't merge editions with different ISBNs"
        err.statusCode.should.equal 400
        done()
    .catch undesiredErr(done)

    return

  it 'should transfer claims', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      addClaim workA.uri, 'wdt:P50', 'wd:Q535'
      .then -> merge workA.uri, workB.uri
      .then -> getByUris workB.uri
      .then (res)->
        authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual [ 'wd:Q535' ]
        done()
    .catch undesiredErr(done)

    return

  it 'should transfer labels', (done)->
    label = randomString 6
    Promise.all [
      createWork { labels: { zh: label } }
      createWork()
    ]
    .spread (workA, workB)->
      merge workA.uri, workB.uri
      .then -> getByUris workB.uri
      .then (res)->
        res.entities[workB.uri].labels.zh.should.equal label
        done()
    .catch undesiredErr(done)

    return

  it 'should keep track of the patch context', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      addClaim workA.uri, 'wdt:P50', 'wd:Q535'
      .then -> merge workA.uri, workB.uri
      .then -> getHistory workB._id
      .then (res)->
        res.patches[1].context.mergeFrom.should.equal workA.uri
        done()
    .catch undesiredErr(done)

    return

  it 'should redirect claims', (done)->
    Promise.all [
      createHuman()
      createHuman()
      createWork()
    ]
    .spread (humanA, humanB, work)->
      addClaim work.uri, 'wdt:P50', humanA.uri
      .then -> merge humanA.uri, humanB.uri
      .then -> getByUris work.uri
      .then (res)->
        authorsUris = res.entities[work.uri].claims['wdt:P50']
        authorsUris.should.deepEqual [ humanB.uri ]
      .then -> getHistory work._id
      .then (res)->
        # patch 0: create the work entity
        # patch 1: add a wdt:P50 claim pointing to to humanA
        # patch 2: redirect to humanB
        res.patches[2].context.redirectClaims
        .should.deepEqual { fromUri: humanA.uri }
        done()
    .catch undesiredErr(done)

    return

  it 'should reject merge of a redirection to an inv entity', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      merge workA.uri, workB.uri
      .then -> merge workA.uri, workB.uri
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose
        .should.equal 'mergeDocs (from) failed: the entity is a redirection'
        done()
    .catch undesiredErr(done)

    return

  it 'should reject a circular merge', (done)->
    createWork()
    .then (work)->
      merge work.uri, work.uri
      .then undesiredRes(done)
      .catch (err)->
        err.statusCode.should.equal 400
        err.body.status_verbose
        .should.equal "can't merge an entity into itself"
        done()
    .catch undesiredErr(done)

    return

CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, adminReq, undesiredErr } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ getByUris, merge, revertMerge, updateLabel, addClaim } = require '../utils/entities'
{ createWork, createHuman } = require '../fixtures/entities'

describe 'entities:revert-merge', ->
  it 'should revert merge two entities with an inv URI', (done)->
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
        revertMerge workA.uri
      .then -> getByUris workA.uri
      .then (res)->
        should(res.redirects[workA.uri]).not.be.ok()
        res.entities[workA.uri].should.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert claims transfer', (done)->
    Promise.all [
      createWork()
      createWork()
      createHuman()
    ]
    .spread (workA, workB, author)->
      addClaim workA.uri, 'wdt:P50', author.uri
      .then -> merge workA.uri, workB.uri
      .then -> getByUris workB.uri
      .then (res)->
        authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual [ author.uri ]
        revertMerge workA.uri
      .then -> getByUris workB.uri
      .then (res)->
        authorsUris = res.entities[workB.uri].claims['wdt:P50']
        should(authorsUris).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert labels transfer', (done)->
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
        revertMerge workA.uri
      .then -> getByUris workB.uri
      .then (res)->
        should(res.entities[workB.uri].labels.zh).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert claim transfers, even when several patches away', (done)->
    Promise.all [
      createWork()
      createWork()
      createHuman()
      createHuman()
    ]
    .spread (workA, workB, authorA, authorB)->
      addClaim workA.uri, 'wdt:P50', authorA.uri
      .then -> merge workA.uri, workB.uri
      .then -> getByUris workB.uri
      # Make another edit between the merge and the revert-merge
      .tap -> addClaim workB.uri, 'wdt:P50', authorB.uri
      .then (res)->
        authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual [ authorA.uri ]
        revertMerge workA.uri
      .then -> getByUris workB.uri
      .then (res)->
        authorsUris = res.entities[workB.uri].claims['wdt:P50']
        authorsUris.should.deepEqual [ authorB.uri ]
        done()
    .catch undesiredErr(done)

    return

  it 'should revert labels transfer', (done)->
    labelA = randomString 6
    labelB = randomString 6
    Promise.all [
      createWork { labels: { zh: labelA } }
      createWork()
    ]
    .spread (workA, workB)->
      merge workA.uri, workB.uri
      .then -> getByUris workB.uri
      # Make another edit between the merge and the revert-merge
      .tap -> updateLabel workB.uri, 'nl', labelB
      .then (res)->
        res.entities[workB.uri].labels.zh.should.equal labelA
        revertMerge workA.uri
      .then -> getByUris workB.uri
      .then (res)->
        should(res.entities[workB.uri].labels.zh).not.be.ok()
        done()
    .catch undesiredErr(done)

    return

  it 'should revert redirected claims', (done)->
    Promise.all [
      createHuman()
      createHuman()
      createWork()
    ]
    .spread (humanA, humanB, work)->
      addClaim work.uri, 'wdt:P50', humanA.uri
      .then -> merge humanA.uri, humanB.uri
      .then -> revertMerge humanA.uri
      .then -> getByUris work.uri
      .then (res)->
        authorsUris = res.entities[work.uri].claims['wdt:P50']
        authorsUris.should.deepEqual [ humanA.uri ]
        done()
    .catch undesiredErr(done)

    return

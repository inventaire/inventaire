CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, getUserId, undesiredErr } = require '../utils/utils'
{ getByIds } = require '../utils/items'
{ getByUris, merge, updateLabel, updateClaim } = require '../utils/entities'
{ ensureEditionExists } = require '../fixtures/entities'
{ createWork, createHuman, createSerie, addAuthor, addSerie, createEditionFromWorks, createWorkWithAuthor, humanName } = require '../fixtures/entities'
{ updateClaim } = require '../utils/entities'

describe 'items:snapshot', ->
  it 'should be updated when its local edition entity title changes', (done)->
    createWork()
    .then createEditionFromWorks
    .then (res)->
      { _id:entityId, uri } = res
      authReq 'post', '/api/items', { entity: uri }
      .then (item)->
        currentTitle = item.snapshot['entity:title']
        updatedTitle = currentTitle.split('$$')[0] + '$$' + new Date().toISOString()

        updateClaim entityId, 'wdt:P1476', currentTitle, updatedTitle
        .delay 100
        .then -> getItem item
        .then (updatedItem)->
          updatedItem.snapshot['entity:title'].should.equal updatedTitle
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local work entity title changes', (done)->
    createWork()
    .then (res)->
      { _id:entityId, uri } = res
      authReq 'post', '/api/items', { entity: uri, lang: 'en' }
      .then (item)->
        currentTitle = item.snapshot['entity:title']
        updatedTitle = currentTitle + ' ' + new Date().toISOString()
        updateLabel entityId, 'en', updatedTitle
        .delay 100
        .then -> getItem item
        .then (updatedItem)->
          updatedItem.snapshot['entity:title'].should.equal updatedTitle
          done()
    .catch undesiredErr(done)

    return

  it "should snapshot the item's work series names", (done)->
    createWork()
    .then (workEntity)->
      addSerie workEntity
      .delay 100
      .then (serieEntity)->
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'en' }
        .then (item)->
          title = _.values(serieEntity.labels)[0]
          item.snapshot['entity:series'].should.equal title
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local serie entity title changes', (done)->
    createWork()
    .then (workEntity)->
      authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'en' }
      .delay 200
      .then (item)->
        addSerie workEntity
        .delay 200
        .then (serieEntity)->
          title = _.values(serieEntity.labels)[0]
          getItem item
          .then (updatedItem)->
            updatedItem.snapshot['entity:series'].should.equal title
            updatedTitle = title + '-updated'
            updateLabel serieEntity._id, 'en', updatedTitle
            .delay 200
            .then -> getItem item
            .then (reupdatedItem)->
              reupdatedItem.snapshot['entity:series'].should.equal updatedTitle
              done()
    .catch undesiredErr(done)

    return

  it "should snapshot the item's work series ordinal", (done)->
    createWork()
    .then (workEntity)->
      Promise.all [
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'en' }
        addSerie workEntity
      ]
      .delay 100
      .spread (item, serieEntity)->
        updateClaim workEntity._id, 'wdt:P1545', null, '5'
        .delay 100
        .then -> getItem item
        .then (item)->
          item.snapshot['entity:ordinal'].should.equal '5'
          updateClaim workEntity._id, 'wdt:P1545', '5', '6'
          .delay 100
          .then -> getItem item
          .then (item)->
            item.snapshot['entity:ordinal'].should.equal '6'
            done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local author entity title changes (edition entity)', (done)->
    ensureEditionExists 'isbn:9788389920935', null,
      labels: {}
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P212': [ '978-83-89920-93-5' ]
        'wdt:P1476': [ 'some title' ]
    .then (editionDoc)->
      workUri = editionDoc.claims['wdt:P629'][0]
      getByUris workUri
    .then (res)->
      workEntity = _.values(res.entities)[0]
      trueAuthorUri = workEntity.claims['wdt:P50'][0]
      authReq 'post', '/api/items', { entity: 'isbn:9788389920935' }
      .delay 200
      .then (item)->
        updateAuthorName = humanName()
        updateLabel trueAuthorUri, 'en', updateAuthorName
        .delay 200
        .then -> getItem item
        .then (updatedItem)->
          updatedItem.snapshot['entity:authors'].should.equal updateAuthorName
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local author entity title changes (work entity)', (done)->
    createWorkWithAuthor()
    .then (workEntity)->
      authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'en' }
      .then (item)->
        updateAuthorName = humanName()
        uri = workEntity.claims['wdt:P50'][0]
        updateLabel uri, 'en', updateAuthorName
        .delay 100
        .then -> getItem item
        .then (item)->
          item.snapshot['entity:authors'].should.equal updateAuthorName
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local work entity is merged (work entity)', (done)->
    Promise.all [
      getUserId()
      createWork()
      createWork()
    ]
    .spread (userId, workEntityA, workEntityB)->
      authReq 'post', '/api/items', { entity: workEntityA.uri, lang: 'en' }
      .tap -> merge workEntityA.uri, workEntityB.uri
      .then getItem
      .then (updatedItem)->
        updatedTitle = workEntityB.labels.en
        updatedItem.snapshot['entity:title'].should.equal updatedTitle
        done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local work entity is merged (edition entity)', (done)->
    Promise.all [
      getUserId()
      createWork()
      createWork()
    ]
    .spread (userId, workEntityA, workEntityB)->
      createEditionFromWorks workEntityA
      .then (editionEntity)->
        Promise.all [
          authReq 'post', '/api/items', { entity: editionEntity.uri }
          addAuthor workEntityB
        ]
        .delay 200
        .tap -> merge workEntityA.uri, workEntityB.uri
        .delay 200
        .spread (item, addedAuthor)->
          getItem item
          .then (updatedItem)->
            authorName = _.values(addedAuthor.labels)[0]
            updatedItem.snapshot['entity:authors'].should.equal authorName
            done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local author entity is merged', (done)->
    Promise.all [
      getUserId()
      createHuman()
      createHuman()
    ]
    .spread (userId, authorEntityA, authorEntityB)->
      createWorkWithAuthor authorEntityA
      .then (workEntity)->
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'en' }
      .delay 200
      .tap -> merge authorEntityA.uri, authorEntityB.uri
      .delay 200
      .then getItem
      .then (updatedItem)->
        updatedAuthors = authorEntityB.labels.en
        updatedItem.snapshot['entity:authors'].should.equal updatedAuthors
        done()
    .catch undesiredErr(done)

    return

  it 'should snapshot data from all the works of a composite edition', (done)->
    Promise.all [
      createWork()
      createWork()
    ]
    .spread (workA, workB)->
      Promise.all [
        addAuthor(workA)
        addAuthor(workB)
      ]
      .then (authors)->
        Promise.all [
          addSerie(workA)
          addSerie(workB)
        ]
        .then (series)->
          createEditionFromWorks(workA, workB)
          .then (edition)-> authReq 'post', '/api/items', { entity: edition.uri }
          .then (item)->
            authorsNames = authors.map((author)-> author.labels.en).join(', ')
            seriesNames = series.map((serie)-> serie.labels.en).join(', ')
            item.snapshot['entity:authors'].should.equal authorsNames
            item.snapshot['entity:series'].should.equal seriesNames
            done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its entity changes', (done)->
    Promise.all [
      getUserId()
      createWork()
    ]
    .spread (userId, workEntityA)->
      Promise.all [
        createEditionFromWorks workEntityA
        authReq 'post', '/api/items', { entity: workEntityA.uri, lang: 'en' }
      ]
      .delay 100
      .spread (editionEntity, item)->
        getByIds item._id
        .then (res)->
          item = res.items[0]
          item.entity = editionEntity.uri
          return authReq 'put', '/api/items', item
        .then (updatedItem)->
          editionTitle = editionEntity.claims['wdt:P1476'][0]
          updatedItem.snapshot['entity:title'].should.equal editionTitle
          done()
    .catch undesiredErr(done)

    return

  # TODO:
  # it 'should be updated when its remote author entity changes', (done)->
  # it 'should be updated when its remote work entity title changes', (done)->

addAuthor = (subjectEntity)->
  createHuman()
  .tap addClaim('wdt:P50', subjectEntity)

addSerie = (subjectEntity)->
  createSerie()
  .tap addClaim('wdt:P179', subjectEntity)

addClaim = (property, subjectEntity)-> (entity)->
  updateClaim subjectEntity._id, property, null, entity.uri

getItem = (item)->
  getByIds item._id
  .then (res)-> res.items[0]

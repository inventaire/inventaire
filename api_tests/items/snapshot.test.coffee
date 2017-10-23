CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, getUser, adminReq, undesiredErr } = require '../utils/utils'
{ ensureEditionExists } = require '../fixtures/entities'
randomString = __.require 'lib', './utils/random_string'

describe 'items:snapshot', ->
  it 'should be updated when its local edition entity title changes', (done)->
    createWorkEntity()
    .then createEditionEntity
    .then (res)->
      { _id:entityId, uri } = res
      authReq 'post', '/api/items', { entity: uri }
      .then (item)->
        currentTitle = item.snapshot['entity:title']
        updatedTitle = currentTitle.split('$$')[0] + '$$' + new Date().toISOString()

        authReq 'put', '/api/entities?action=update-claim',
          id: entityId
          property: 'wdt:P1476'
          'old-value': currentTitle
          'new-value': updatedTitle
        .delay 100
        .then -> getItem item
        .then (updatedItem)->
          updatedItem.snapshot['entity:title'].should.equal updatedTitle
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local work entity title changes', (done)->
    createWorkEntity()
    .then (res)->
      { _id:entityId, uri } = res
      authReq 'post', '/api/items', { entity: uri, lang: 'de' }
      .then (item)->
        currentTitle = item.snapshot['entity:title']
        updatedTitle = currentTitle + ' ' + new Date().toISOString()
        updateLabel entityId, updatedTitle
        .delay 100
        .then -> getItem item
        .then (updatedItem)->
          updatedItem.snapshot['entity:title'].should.equal updatedTitle
          done()
    .catch undesiredErr(done)

    return

  it "should snapshot the item's work series names", (done)->
    createWorkEntity()
    .then (workEntity)->
      addSerie workEntity
      .delay 100
      .then (serieEntity)->
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'de' }
        .then (item)->
          title = _.values(serieEntity.labels)[0]
          item.snapshot['entity:series'].should.equal title
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local serie entity title changes', (done)->
    createWorkEntity()
    .then (workEntity)->
      authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'de' }
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
            updateLabel serieEntity._id, updatedTitle
            .delay 200
            .then -> getItem item
            .then (reupdatedItem)->
              reupdatedItem.snapshot['entity:series'].should.equal updatedTitle
              done()
    .catch undesiredErr(done)

    return

  it "should snapshot the item's work series ordinal", (done)->
    createWorkEntity()
    .then (workEntity)->
      Promise.all [
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'de' }
        addSerie workEntity
      ]
      .delay 100
      .spread (item, serieEntity)->
        authReq 'put', '/api/entities?action=update-claim',
          id: workEntity._id
          property: 'wdt:P1545'
          'new-value': '5'
        .delay 100
        .then -> getItem item
        .then (item)->
          item.snapshot['entity:ordinal'].should.equal '5'
          authReq 'put', '/api/entities?action=update-claim',
            id: workEntity._id
            property: 'wdt:P1545'
            'old-value': '5'
            'new-value': '6'
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
      authReq 'get', "/api/entities?action=by-uris&uris=#{workUri}"
    .then (res)->
      workEntity = _.values(res.entities)[0]
      trueAuthorUri = workEntity.claims['wdt:P50'][0]
      authReq 'post', '/api/items', { entity: 'isbn:9788389920935' }
      .delay 100
      .then (item)->
        updateAuthorName = 'Mr moin moin' + new Date().toISOString()
        authReq 'put', '/api/entities?action=update-label',
          id: trueAuthorUri.split(':')[1]
          lang: 'de'
          value: updateAuthorName
        .delay 100
        .then -> getItem item
        .then (updatedItem)->
          updatedItem.snapshot['entity:authors'].should.equal updateAuthorName
          done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local author entity title changes (work entity)', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { de: 'Mr moin moin' }
      claims: { 'wdt:P31': [ 'wd:Q5' ] }
    .then (authorEntity)->
      authReq 'post', '/api/entities?action=create',
        labels: { de: 'moin moin' }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ authorEntity.uri ]
      .then (workEntity)->
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'de' }
        .then (item)->
          updateAuthorName = 'Mr moin moin' + new Date().toISOString()
          authReq 'put', '/api/entities?action=update-label',
            id: authorEntity._id
            lang: 'de'
            value: updateAuthorName
          .delay 100
          .then -> getItem item
          .then (item)->
            item.snapshot['entity:authors'].should.equal updateAuthorName
            done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local work entity is merged (work entity)', (done)->
    Promise.all [
      getUser().get '_id'
      createWorkEntity()
      createWorkEntity()
    ]
    .spread (userId, workEntityA, workEntityB)->
      authReq 'post', '/api/items', { entity: workEntityA.uri, lang: 'de' }
      .tap -> merge workEntityA, workEntityB
      .then getItem
      .then (updatedItem)->
        updatedTitle = workEntityB.labels.de
        updatedItem.snapshot['entity:title'].should.equal updatedTitle
        done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its local work entity is merged (edition entity)', (done)->
    Promise.all [
      getUser().get '_id'
      createWorkEntity()
      createWorkEntity()
    ]
    .spread (userId, workEntityA, workEntityB)->
      createEditionEntity workEntityA
      .then (editionEntity)->
        Promise.all [
          authReq 'post', '/api/items', { entity: editionEntity.uri }
          addAuthor workEntityB
        ]
        .delay 100
        .tap -> merge workEntityA, workEntityB
        .delay 100
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
      getUser().get '_id'
      createAuthorEntity()
      createAuthorEntity()
    ]
    .spread (userId, authorEntityA, authorEntityB)->
      authReq 'post', '/api/entities?action=create',
        labels: { de: 'moin moin' + randomString(4) }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ authorEntityA.uri ]
      .then (workEntity)->
        authReq 'post', '/api/items', { entity: workEntity.uri, lang: 'de' }
      .delay 100
      .tap -> merge authorEntityA, authorEntityB
      .delay 100
      .then getItem
      .then (updatedItem)->
        updatedAuthors = authorEntityB.labels.de
        updatedItem.snapshot['entity:authors'].should.equal updatedAuthors
        done()
    .catch undesiredErr(done)

    return

  it 'should snapshot data from all the works of a composite edition', (done)->
    Promise.all [
      createWorkEntity()
      createWorkEntity()
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
          createEditionEntity(workA, workB)
          .then (edition)-> authReq 'post', '/api/items', { entity: edition.uri }
          .then (item)->
            authorsNames = authors.map((author)-> author.labels.de).join(', ')
            seriesNames = series.map((serie)-> serie.labels.de).join(', ')
            item.snapshot['entity:authors'].should.equal authorsNames
            item.snapshot['entity:series'].should.equal seriesNames
            done()
    .catch undesiredErr(done)

    return

  it 'should be updated when its entity changes', (done)->
    Promise.all [
      getUser().get '_id'
      createWorkEntity()
    ]
    .spread (userId, workEntityA)->
      Promise.all [
        createEditionEntity workEntityA
        authReq 'post', '/api/items', { entity: workEntityA.uri, lang: 'de' }
      ]
      .delay 100
      .spread (editionEntity, item)->
        authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
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

createEntity = (wdtP31)->
  authReq 'post', '/api/entities?action=create',
    labels: { de: 'moin moin' + randomString(4) }
    claims: { 'wdt:P31': [ wdtP31 ] }

createSerieEntity = -> createEntity 'wd:Q277759'
createAuthorEntity = -> createEntity 'wd:Q5'
createWorkEntity = -> createEntity 'wd:Q571'

createEditionEntity = (works...)->
  worksUris = works.map (work)-> work.uri
  authReq 'post', '/api/entities?action=create',
    claims:
      'wdt:P31': [ 'wd:Q3331189' ]
      'wdt:P629': worksUris
      'wdt:P1476': [ _.values(works[0].labels)[0] ]

addAuthor = (subjectEntity)->
  createAuthorEntity()
  .tap addClaim('wdt:P50', subjectEntity)

addSerie = (subjectEntity)->
  createSerieEntity()
  .tap addClaim('wdt:P179', subjectEntity)

addClaim = (property, subjectEntity)-> (entity)->
  authReq 'put', '/api/entities?action=update-claim',
    id: subjectEntity._id
    property: property
    'new-value': entity.uri

updateLabel = (id, label)->
  authReq 'put', '/api/entities?action=update-label',
    id: id
    lang: 'de'
    value: label

getItem = (item)->
  authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
  .then (res)-> res.items[0]

merge = (from, to)->
  adminReq 'put', '/api/entities?action=merge',
    from: from.uri
    to: to.uri

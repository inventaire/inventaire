CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ authReq, getUser, adminReq } = __.require 'apiTests', 'utils/utils'
{ ensureEditionExists } = require '../entities/helpers'
randomString = __.require 'lib', './utils/random_string'

describe 'items:snapshot', ->
  it 'should be updated when its local edition entity title changes', (done)->
    ensureEditionExists 'isbn:9789100131913', null,
      labels: {}
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P212': [ '978-91-0-013191-3' ]
        # If the entity already exist (because the test databases where reset)
        # the initial entity title might be different
        'wdt:P1476': [ 'Some book edition' ]
    .then (res)->
      { _id:entityId } = res
      authReq 'post', '/api/items', { entity: 'isbn:9789100131913' }
      .then (item)->
        currentTitle = item.snapshot['entity:title']
        updatedTitle = currentTitle.split('$$')[0] + '$$' + new Date().toISOString()
        authReq 'put', '/api/entities?action=update-claim',
          id: entityId
          property: 'wdt:P1476'
          'old-value': currentTitle
          'new-value': updatedTitle
        .delay 100
        .then -> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
        .then (res2)->
          res2.items[0].snapshot['entity:title'].should.equal updatedTitle
          done()
    .catch done

    return

  it 'should be updated when its local work entity title changes', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { de: 'moin moin' }
      claims:
        'wdt:P31': [ 'wd:Q571' ]
        'wdt:P50': [ 'wd:Q535' ]
    .then (res)->
      { _id:entityId, uri } = res
      authReq 'post', '/api/items', { entity: uri, lang: 'de' }
      .then (item)->
        currentTitle = item.snapshot['entity:title']
        updatedTitle = currentTitle + ' ' + new Date().toISOString()
        authReq 'put', '/api/entities?action=update-label',
          id: entityId
          lang: 'de'
          value: updatedTitle
        .delay 100
        .then -> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
        .then (res2)->
          res2.items[0].snapshot['entity:title'].should.equal updatedTitle
          done()
    .catch done

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
        .then -> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
        .then (res)->
          res.items[0].snapshot['entity:authors'].should.equal updateAuthorName
          done()
    .catch done

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
          .then -> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
          .then (res)->
            res.items[0].snapshot['entity:authors'].should.equal updateAuthorName
            done()
    .catch done

    return

  it 'should be updated when its local work entity is merged (work entity)', (done)->
    Promise.all [
      getUser().get '_id'
      createWorkEntity()
      createWorkEntity()
    ]
    .spread (userId, workEntityA, workEntityB)->
      authReq 'post', '/api/items', { entity: workEntityA.uri, lang: 'de' }
      .tap ->
        adminReq 'put', '/api/entities?action=merge',
          from: workEntityA.uri
          to: workEntityB.uri
      .then (item)-> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
      .then (res)->
        updatedItem = res.items[0]
        updatedTitle = workEntityB.labels.de
        updatedItem.snapshot['entity:title'].should.equal updatedTitle
        done()
    .catch done

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
        .tap ->
          adminReq 'put', '/api/entities?action=merge',
            from: workEntityA.uri
            to: workEntityB.uri
        .delay 100
        .spread (item, addedAuthor)->
          authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
          .then (res)->
            updatedItem = res.items[0]
            authorName = _.values(addedAuthor.labels)[0]
            updatedItem.snapshot['entity:authors'].should.equal authorName
            done()
    .catch done

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
      .tap ->
        adminReq 'put', '/api/entities?action=merge',
          from: authorEntityA.uri
          to: authorEntityB.uri
      .delay 100
      .then (item)-> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
      .then (res)->
        updatedItem = res.items[0]
        updatedAuthors = authorEntityB.labels.de
        updatedItem.snapshot['entity:authors'].should.equal updatedAuthors
        done()
    .catch done

    return

  # TODO:
  # it 'should be updated when its remote author entity changes', (done)->
  # it 'should be updated when its remote work entity title changes', (done)->

createAuthorEntity = ->
  authReq 'post', '/api/entities?action=create',
    labels: { de: 'Mr moin moin'  + randomString(4) }
    claims: { 'wdt:P31': [ 'wd:Q5' ] }

createWorkEntity = ->
  authReq 'post', '/api/entities?action=create',
    labels: { de: 'moin moin' + randomString(4) }
    claims: { 'wdt:P31': [ 'wd:Q571' ] }

createEditionEntity = (workEntity)->
  authReq 'post', '/api/entities?action=create',
    labels: { de: 'moin moin' + randomString(4) }
    claims:
      'wdt:P31': [ 'wd:Q3331189' ]
      'wdt:P629': [ workEntity.uri ]
      'wdt:P1476': [ _.values(workEntity.labels)[0] ]

addAuthor = (workEntity)->
  createAuthorEntity()
  .tap (authorEntity)->
    authReq 'put', '/api/entities?action=update-claim',
      id: workEntity._id
      property: 'wdt:P50'
      'new-value': authorEntity.uri

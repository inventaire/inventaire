CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq, getUser } = __.require 'apiTests', 'utils/utils'
{ newItemBase, CountChange } = require './helpers'
{ ensureEditionExists } = require '../entities/helpers'

describe 'items:create', ->
  it 'should create an item', (done)->
    getUser()
    .then (user)->
      userId = user._id
      authReq 'post', '/api/items', newItemBase()
      .then (item)->
        item.entity.should.equal 'wd:Q3548806'
        item.listing.should.equal 'private'
        item.transaction.should.equal 'inventorying'
        item.owner.should.equal userId
      # Delay so that the item counter update doesn't impact the following test
      .delay 10
      .then -> done()

    return

  it 'should increment the user items counter', (done)->
    getUser()
    .then (userBefore)->
      userId = userBefore._id
      authReq 'post', '/api/items', newItemBase()
      # Delay to request the user after its items count was updated
      .delay 10
      .then (res)->
        getUser()
        .then (userAfter)->
          countChange = CountChange userBefore.snapshot, userAfter.snapshot
          countChange('private').should.equal 1
          countChange('network').should.equal 0
          countChange('public').should.equal 0
          done()

    return

  it 'should deduce the title from an edition entity', (done)->
    title = 'Un mariage à Lyon'
    ensureEditionExists 'isbn:9782253138938', null,
      labels: {}
      claims:
        'wdt:P31': [ 'wd:Q3331189' ]
        'wdt:P212': [ '978-2-253-13893-8' ]
        'wdt:P1476': [ title ]
    .then ->
      authReq 'post', '/api/items', { entity: 'isbn:9782253138938' }
      .then (item)->
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:title'].should.equal title
        done()

    return

  it 'should deduce the author from a work entity', (done)->
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
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:authors'].should.equal 'Mr moin moin'
        done()

    return

  it 'should deduce the author from an edition entity', (done)->
    authReq 'post', '/api/entities?action=create',
      labels: { de: 'Mr moin moin' }
      claims: { 'wdt:P31': [ 'wd:Q5' ] }
    .then (authorEntity)->
      workData =
        labels: { de: 'moin moin' }
        claims:
          'wdt:P31': [ 'wd:Q571' ]
          'wdt:P50': [ authorEntity.uri ]

      ensureEditionExists 'isbn:9782315006113', workData,
        labels: {}
        claims:
          'wdt:P31': [ 'wd:Q3331189' ]
          'wdt:P212': [ '978-2-315-00611-3' ]
          'wdt:P1476': [ 'Gouverner par le Chaos' ]
    .then ->
      authReq 'post', '/api/items', { entity: 'isbn:9782315006113' }
      .then (item)->
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:authors'].should.equal 'Mr moin moin'
        done()

    return

  it 'should reject an item created with a non-whitelisted entity type', (done)->
    authReq 'post', '/api/items', { entity: 'wd:Q1', lang: 'fr' }
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'invalid entity type'
      done()

    return

  it 'should reject an item created with a work entity without specifying in which lang the title is', (done)->
    authReq 'post', '/api/items', { entity: 'wd:Q3548806' }
    .catch (err)->
      err.statusCode.should.equal 400
      done()

    return

  it 'should deduce the title from a work entity and a lang', (done)->
    uri = 'wd:Q3548806'
    lang = 'fr'
    authReq 'get', "/api/entities?action=by-uris&uris=#{uri}"
    .get 'entities'
    .then (entities)->
      title = entities[uri].labels[lang]
      authReq 'post', '/api/items', { entity: 'wd:Q3548806', lang: 'fr' }
      .then (item)->
        item.snapshot.should.be.an.Object()
        item.snapshot['entity:title'].should.equal title
        done()

    return

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
      .then (item)->
        updateAuthorName = 'Mr moin moin' + new Date().toISOString()
        authReq 'put', '/api/entities?action=update-label',
          id: trueAuthorUri.split(':')[1]
          lang: 'de'
          value: updateAuthorName
        .delay 1000
        .then -> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
        .then (res)->
          res.items[0].snapshot['entity:authors'].should.equal updateAuthorName
          done()

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
          .delay 1000
          .then -> authReq 'get', "/api/items?action=by-ids&ids=#{item._id}"
          .then (res)->
            res.items[0].snapshot['entity:authors'].should.equal updateAuthorName
            done()

    return

  # TODO:
  # it 'should be updated when its local author entity is merged', (done)->
  # it 'should be updated when its remote work entity title changes', (done)->

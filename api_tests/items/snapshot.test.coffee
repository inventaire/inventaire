CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ authReq } = __.require 'apiTests', 'utils/utils'
{ ensureEditionExists } = require '../entities/helpers'

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

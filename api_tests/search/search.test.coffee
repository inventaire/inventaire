CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, authReq, undesiredRes, undesiredErr, getUser } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ createWork, createHuman, createSerie } = require '../fixtures/entities'
{ createEditionFromWorks } = require '../fixtures/entities'

describe 'search:global', ->
  it 'should reject empty searches', (done)->
    nonAuthReq 'get', '/api/search?lang=fr&types=works'
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'missing parameter in query: search'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject search without types', (done)->
    nonAuthReq 'get', '/api/search?search=yo&lang=fr'
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'missing parameter in query: types'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject invalid types', (done)->
    nonAuthReq 'get', '/api/search?search=yo&types=da&lang=fr'
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'invalid type: da'
      done()
    .catch undesiredErr(done)

    return

  it 'should reject search without lang', (done)->
    nonAuthReq 'get', '/api/search?search=yo&types=works'
    .then undesiredRes(done)
    .catch (err)->
      err.statusCode.should.equal 400
      err.body.status_verbose.should.equal 'missing parameter in query: lang'
      done()
    .catch undesiredErr(done)

    return

  it 'should return a wikidata human', (done)->
    nonAuthReq 'get', '/api/search?search=Gilles%20Deleuze&types=humans&lang=fr'
    .then (res)->
      { results } = res
      results.should.be.an.Array()
      results.forEach (result)-> result.type.should.equal 'humans'
      _.pluck(results, 'id').includes('Q184226').should.be.true()
      done()
    .catch undesiredErr(done)

    return

  it 'should return a local human', (done)->
    label = randomString 5
    createHuman { labels: { fr: label } }
    # Let the time for Elastic Search indexation
    .delay 1000
    .then (entity)->
      nonAuthReq 'get', "/api/search?search=#{label}&types=humans&lang=fr"
      .then (res)->
        { results } = res
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'humans'
        _.pluck(results, 'id').includes(entity._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a local work', (done)->
    label = randomString 5
    createWork { labels: { fr: label } }
    # Let the time for Elastic Search indexation
    .delay 1000
    .then (entity)->
      nonAuthReq 'get', "/api/search?search=#{label}&types=works&lang=fr"
      .then (res)->
        { results } = res
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'works'
        _.pluck(results, 'id').includes(entity._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a wikidata work', (done)->
    nonAuthReq 'get', '/api/search?search=Les%20Misérables&types=works&lang=fr'
    .then (res)->
      { results } = res
      results.should.be.an.Array()
      results.forEach (result)-> result.type.should.equal 'works'
      _.pluck(results, 'id').includes('Q180736').should.be.true()
      done()
    .catch undesiredErr(done)

    return

  it 'should return a local serie', (done)->
    label = randomString 5
    createSerie { labels: { fr: label } }
    # Let the time for Elastic Search indexation
    .delay 1000
    .then (entity)->
      nonAuthReq 'get', "/api/search?search=#{label}&types=series&lang=fr"
      .then (res)->
        { results } = res
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'series'
        _.pluck(results, 'id').includes(entity._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a wikidata serie', (done)->
    nonAuthReq 'get', '/api/search?search=Harry%20Potter&types=series&lang=fr'
    .then (res)->
      { results } = res
      results.should.be.an.Array()
      results.forEach (result)-> result.type.should.equal 'series'
      _.pluck(results, 'id').includes('Q8337').should.be.true()
      done()
    .catch undesiredErr(done)

    return

  it 'should return a user', (done)->
    getUser()
    .delay 1000
    .then (user)->
      { username } = user
      nonAuthReq 'get', "/api/search?search=#{username}&types=users&lang=fr"
      .then (res)->
        { results } = res
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'users'
        _.pluck(results, 'id').includes(user._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a group', (done)->
    name = randomString 5
    authReq 'post', '/api/groups?action=create', { name }
    .delay 1000
    .then (group)->
      nonAuthReq 'get', "/api/search?search=#{name}&types=groups&lang=fr"
      .then (res)->
        { results } = res
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'groups'
        _.pluck(results, 'id').includes(group._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not return a private group unless requester is a member', (done)->
    name = randomString 5
    authReq 'post', '/api/groups?action=create', { name, searchable: false }
    .delay 1000
    .then (group)->
      nonAuthReq 'get', "/api/search?search=#{name}&types=groups&lang=fr"
      .then (res)->
        { results } = res
        _.pluck(results, 'id').includes(group._id).should.be.false()
        # The same request but authentified with a group member account
        # should find the group
        authReq 'get', "/api/search?search=#{name}&types=groups&lang=fr"
        .then (res)->
          { results } = res
          _.pluck(results, 'id').includes(group._id).should.be.true()
          done()
    .catch undesiredErr(done)

    return

  it 'should sort entities by global score', (done)->
    fullMatchLabel = randomString 15
    partialMatchLabel = fullMatchLabel + ' a'
    createWork { labels: { fr: partialMatchLabel } }
    .then (work)->
      Promise.all [
        createEditionFromWorks work
        createWork { labels: { fr: fullMatchLabel } }
      ]
      .delay 1000
      .then ->
        workWithEditionUri = work.uri
        url = "/api/search?search=#{fullMatchLabel}&types=works&lang=fr"
        getRefreshedEntitiesResult url
        .then (results)->
          firstResultUri = results[0].uri
          firstResultUri.should.equal workWithEditionUri
          done()
    .catch undesiredErr(done)

    return

  it 'should return a global score boosted by a logarithmic popularity', (done)->
    workLabel = randomString(15)
    createWork { labels: { fr: workLabel } }
    .then (work)->
      workEditionsCreation = [
        createEditionFromWorks work
        createEditionFromWorks work
      ]
      Promise.all workEditionsCreation
      .delay 500
      .then ->
        url = "/api/search?search=#{workLabel}&types=works&lang=fr"
        getRefreshedEntitiesResult url
        .then (results)->
          firstEntityResult = results[0]
          boostLimit = firstEntityResult.lexicalScore + workEditionsCreation.length
          firstEntityResult.globalScore.should.be.below boostLimit
          done()
    .catch undesiredErr(done)

    return

getRefreshedEntitiesResult = (url)->
  # Refresh result entities popularity, then get refreshed entities
  nonAuthReq 'get', url
  .delay 500
  .then -> nonAuthReq 'get', url
  .get 'results'

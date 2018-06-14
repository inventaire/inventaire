CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
faker = require 'faker'
{ Promise } = __.require 'lib', 'promises'
{ nonAuthReq, authReq, undesiredRes, undesiredErr, getUser } = require '../utils/utils'
randomString = __.require 'lib', './utils/random_string'
{ createWork, createHuman, createSerie, humanName, workLabel } = require '../fixtures/entities'
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
    search 'da', 'yo'
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
    search 'humans', 'Gilles Deleuze'
    .then (results)->
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
    .delay 4000
    .then (entity)->
      search 'humans', label
      .then (results)->
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
    .delay 4000
    .then (entity)->
      search 'works', label
      .then (results)->
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'works'
        _.pluck(results, 'id').includes(entity._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a wikidata work', (done)->
    search 'works', 'Les Misérables'
    .then (results)->
      results.should.be.an.Array()
      results.forEach (result)-> result.type.should.equal 'works'
      _.pluck(results, 'id').includes('Q180736').should.be.true()
      done()
    .catch undesiredErr(done)

    return

  it 'should return a local serie', (done)->
    label = workLabel()
    createSerie { labels: { fr: label } }
    # Let the time for Elastic Search indexation
    .delay 1000
    .then (entity)->
      search 'series', label
      .then (results)->
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'series'
        _.pluck(results, 'id').includes(entity._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a wikidata serie', (done)->
    search 'series', 'Harry Potter'
    .then (results)->
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
      search 'users', user.username
      .then (results)->
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'users'
        _.pluck(results, 'id').includes(user._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a group', (done)->
    name = "group #{faker.lorem.word}"
    authReq 'post', '/api/groups?action=create', { name }
    .delay 1000
    .then (group)->
      search 'groups', name
      .then (results)->
        results.should.be.an.Array()
        results.forEach (result)-> result.type.should.equal 'groups'
        _.pluck(results, 'id').includes(group._id).should.be.true()
        done()
    .catch undesiredErr(done)

    return

  it 'should not return a private group unless requester is a member', (done)->
    name = "group #{faker.lorem.word}"
    authReq 'post', '/api/groups?action=create', { name, searchable: false }
    .delay 1000
    .then (group)->
      search 'groups', name
      .then (results)->
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
        search 'works', fullMatchLabel
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
        search 'works', workLabel
        .then (results)->
          firstEntityResult = results[0]
          boostLimit = firstEntityResult.lexicalScore + workEditionsCreation.length
          firstEntityResult.globalScore.should.be.below boostLimit
          done()
    .catch undesiredErr(done)

    return

search = (types, search)->
  search = encodeURIComponent search
  nonAuthReq 'get', "/api/search?search=#{search}&types=#{types}&lang=fr&limit=50"
  .get 'results'

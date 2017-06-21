CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ adminReq, authReq, getUser, undesiredErr } = __.require 'apiTests', 'utils/utils'

describe 'entities:get:contributions', ->
  it 'should return a list of patches', (done)->
    getUser()
    .then (user)->
      { _id } = user
      adminReq 'get', "/api/entities?action=contributions&user=#{_id}"
      .then (res)->
        res.patches.should.be.an.Array()
        done()
    .catch undesiredErr(done)

    return

  it 'should return a list of patches ordered by timestamp', (done)->
    create2WorksAndGetUser()
    .spread (workA, workB, user)->
      { _id } = user
      adminReq 'get', "/api/entities?action=contributions&user=#{_id}"
      .then (res)->
        { patches } = res
        workB._id.should.equal patches[0]._id.split(':')[0]
        workA._id.should.equal patches[1]._id.split(':')[0]
        done()
    .catch undesiredErr(done)

    return

  it 'should take a limit parameter', (done)->
    create2WorksAndGetUser()
    .spread (workA, workB, user)->
      { _id } = user
      adminReq 'get', "/api/entities?action=contributions&user=#{_id}&limit=1"
      .then (res)->
        { patches } = res
        patches.length.should.equal 1
        workB._id.should.equal patches[0]._id.split(':')[0]
        done()
    .catch undesiredErr(done)

    return

  it 'should take an offset parameter', (done)->
    create2WorksAndGetUser()
    .spread (workA, workB, user)->
      { _id } = user
      adminReq 'get', "/api/entities?action=contributions&user=#{_id}&limit=1&offset=1"
      .then (res)->
        { patches } = res
        patches.length.should.equal 1
        workA._id.should.equal patches[0]._id.split(':')[0]
        done()
    .catch undesiredErr(done)

    return

  it 'should return total and continue data', (done)->
    create2WorksAndGetUser()
    .spread (workA, workB, user)->
      { _id } = user
      adminReq 'get', "/api/entities?action=contributions&user=#{_id}&limit=1"
      .then (res1)->
        res1.total.should.be.a.Number()
        should(res1.total >= 2).be.true()
        res1.continue.should.be.a.Number()
        res1.continue.should.equal 1
        getWorkId(res1.patches[0]._id).should.equal workB._id
        create2WorksAndGetUser()
        .spread (workC, workD)->
          adminReq 'get', "/api/entities?action=contributions&user=#{_id}&limit=3"
          .then (res2)->
            getWorkId(res2.patches[0]._id).should.equal workD._id
            getWorkId(res2.patches[1]._id).should.equal workC._id
            getWorkId(res2.patches[2]._id).should.equal workB._id
            res2.continue.should.equal 3
            res2.total.should.equal(res1.total + 2)
            adminReq 'get', "/api/entities?action=contributions&user=#{_id}&offset=3"
            .then (res3)->
              getWorkId(res3.patches[0]._id).should.equal workA._id
              done()
    .catch undesiredErr(done)

    return

createWork = ->
  authReq 'post', '/api/entities?action=create',
    labels: { fr: 'bla' }
    claims: { 'wdt:P31': [ 'wd:Q571' ] }

create2WorksAndGetUser = ->
  createWork()
  .then (workA)->
    createWork()
    .then (workB)->
      getUser()
      .then (user)-> [ workA, workB, user]

getWorkId = (id)-> id.split(':')[0]

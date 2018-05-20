CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'
should = require 'should'
{ nonAuthReq, undesiredRes, undesiredErr } = __.require 'apiTests', 'utils/utils'
{ populate } = require '../fixtures/populate'
recentPublicUrl = '/api/items?action=recent-public'

describe 'items:recent-public', ->
  it 'should fetch 15 recent-public items', (done)->
    populate()
    .then -> nonAuthReq 'get', recentPublicUrl
    .then (res)-> res.items.length.should.equal 15
    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return

  it 'should fetch items from minimum 5 owners', (done)->
    populate()
    .then -> nonAuthReq 'get', recentPublicUrl
    .then (res)-> res.users.length.should.be.above 4
    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return

  it 'should take a limit parameter', (done)->
    populate()
    .then -> nonAuthReq 'get', "#{recentPublicUrl}&limit=3"
    .then (res)-> res.items.length.should.equal 3
    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return

  it 'should take a lang parameter', (done)->
    populate()
    .then -> nonAuthReq 'get', "#{recentPublicUrl}&lang=de"
    .then (res)-> _.all(res.items, itemLangIs('de')).should.be.true()
    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return

  it 'should return the most recent items', (done)->
    populate()
    .then -> nonAuthReq 'get', recentPublicUrl
    .then (res)-> _.all(res.items, createdLately).should.be.true()
    .delay 10
    .then -> done()
    .catch undesiredErr(done)
    return

  it 'should reject invalid limit', (done)->
    nonAuthReq 'get', "#{recentPublicUrl}&limit=bla"
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid limit: bla'
      done()
    .catch undesiredErr(done)
    return

  it 'should reject invalid lang', (done)->
    nonAuthReq 'get', "#{recentPublicUrl}&lang=bla"
    .then undesiredRes(done)
    .catch (err)->
      err.body.status_verbose.should.equal 'invalid lang: bla'
      done()
    .catch undesiredErr(done)
    return

itemLangIs = (lang)-> (item)-> item.snapshot['entity:lang'] is lang
createdLately = (item)-> not _.expired(item.created, 120000)

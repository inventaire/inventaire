CONFIG = require 'config'
__ = CONFIG.universalPath
_ = __.require 'builders', 'utils'

should = require 'should'
sinon = require 'sinon'

promises_ = __.require 'lib', 'promises'
{ Promise } = promises_

requestGrouper = __.require 'lib', 'request_grouper'

MockRequester = (spy=_.noop)-> (ids)->
  spy()
  Promise.resolve mockRequesterSync(ids)

mockRequesterSync = (ids)->
  results = {}
  for id in ids
    results[id] = mockRequesterSingleSync id

  _.log results, 'results'
  return results

mockRequesterSingleSync = (id)-> "yep:#{id}"

describe 'Request Grouper', ->
  it 'should return a function', (done)->
    singleRequest = requestGrouper
      delay: 10
      requester: MockRequester()

    singleRequest.should.be.a.Function()
    done()

  it 'should return a function that returns a promise', (done)->
    singleRequest = requestGrouper
      delay: 10
      requester: MockRequester()

    singleRequest 'input1'
    .then done()

    return

  it 'should return a function that returns just the input value', (done)->
    spy = sinon.spy()
    fn = requestGrouper
      delay: 10
      requester: MockRequester spy

    Promise.all [
      fn('input1').then (res)-> res.should.equal mockRequesterSingleSync('input1')
      fn('input2').then (res)-> res.should.equal mockRequesterSingleSync('input2')
      fn('input3').then (res)-> res.should.equal mockRequesterSingleSync('input3')
    ]
    .then ->
      spy.callCount.should.equal 1
      done()

    return

  it 'should throttle, not debounce: not waiting for inputs after the delay', (done)->
    spy = sinon.spy()
    fn = requestGrouper
      delay: 10
      requester: MockRequester spy

    fn('input1').then (res)-> res.should.equal mockRequesterSingleSync('input1')
    fn('input2').then (res)-> res.should.equal mockRequesterSingleSync('input2')

    late = ->
      fn 'input3'
      .then (res)->
        res.should.equal mockRequesterSingleSync('input3')
        spy.callCount.should.equal 2
        done()

    setTimeout late, 11

    return

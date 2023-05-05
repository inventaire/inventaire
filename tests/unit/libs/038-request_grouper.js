import 'should'
import sinon from 'sinon'
import _ from '#builders/utils'
import { wait } from '#lib/promises'
import requestGrouper from '#lib/request_grouper'
import { log } from '#lib/utils/logs'

const MockRequester = (spy = _.noop) => async ids => {
  spy()
  return mockRequesterSync(ids)
}

const mockRequesterSync = ids => {
  const results = {}
  for (const id of ids) {
    results[id] = mockRequesterSingleSync(id)
  }

  log(results, 'results')
  return results
}

const mockRequesterSingleSync = id => `yep:${id}`

describe('Request Grouper', () => {
  it('should return a function', () => {
    const singleRequest = requestGrouper({
      delay: 10,
      requester: MockRequester(),
    })

    singleRequest.should.be.a.Function()
  })

  it('should return a function that returns a promise', async () => {
    const singleRequest = requestGrouper({
      delay: 10,
      requester: MockRequester(),
    })
    await singleRequest('input1')
  })

  it('should return a function that returns just the input value', async () => {
    const spy = sinon.spy()
    const fn = requestGrouper({
      delay: 10,
      requester: MockRequester(spy),
    })

    await Promise.all([
      fn('input1').then(res => res.should.equal(mockRequesterSingleSync('input1'))),
      fn('input2').then(res => res.should.equal(mockRequesterSingleSync('input2'))),
      fn('input3').then(res => res.should.equal(mockRequesterSingleSync('input3'))),
    ])

    spy.callCount.should.equal(1)
  })

  it('should throttle, not debounce: not waiting for inputs after the delay', async () => {
    const spy = sinon.spy()
    const fn = requestGrouper({
      delay: 10,
      requester: MockRequester(spy),
    })

    await Promise.all([
      fn('input1').then(res => res.should.equal(mockRequesterSingleSync('input1'))),
      wait(1).then(() => fn('input2').then(res => res.should.equal(mockRequesterSingleSync('input2')))),
      wait(5).then(() => fn('input3').then(res => res.should.equal(mockRequesterSingleSync('input3')))),
      wait(9).then(() => fn('input4').then(res => res.should.equal(mockRequesterSingleSync('input4')))),
      wait(11).then(() => fn('input5').then(res => res.should.equal(mockRequesterSingleSync('input5')))),
      wait(13).then(() => fn('input6').then(res => res.should.equal(mockRequesterSingleSync('input6')))),
      wait(16).then(() => fn('input7').then(res => res.should.equal(mockRequesterSingleSync('input7')))),
      wait(28).then(() => fn('input8').then(res => res.should.equal(mockRequesterSingleSync('input8')))),
    ])

    spy.callCount.should.be.aboveOrEqual(2)
  })
})

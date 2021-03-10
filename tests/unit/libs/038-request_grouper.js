const _ = require('builders/utils')

require('should')
const sinon = require('sinon')

const requestGrouper = require('lib/request_grouper')

const MockRequester = (spy = _.noop) => async ids => {
  spy()
  return mockRequesterSync(ids)
}

const mockRequesterSync = ids => {
  const results = {}
  for (const id of ids) {
    results[id] = mockRequesterSingleSync(id)
  }

  _.log(results, 'results')
  return results
}

const mockRequesterSingleSync = id => `yep:${id}`

describe('Request Grouper', () => {
  it('should return a function', () => {
    const singleRequest = requestGrouper({
      delay: 10,
      requester: MockRequester()
    })

    singleRequest.should.be.a.Function()
  })

  it('should return a function that returns a promise', done => {
    const singleRequest = requestGrouper({
      delay: 10,
      requester: MockRequester()
    })

    singleRequest('input1')
    .then(() => done())
    .catch(done)
  })

  it('should return a function that returns just the input value', async () => {
    const spy = sinon.spy()
    const fn = requestGrouper({
      delay: 10,
      requester: MockRequester(spy)
    })

    await Promise.all([
      fn('input1').then(res => res.should.equal(mockRequesterSingleSync('input1'))),
      fn('input2').then(res => res.should.equal(mockRequesterSingleSync('input2'))),
      fn('input3').then(res => res.should.equal(mockRequesterSingleSync('input3')))
    ])

    spy.callCount.should.equal(1)
  })

  it('should throttle, not debounce: not waiting for inputs after the delay', done => {
    const spy = sinon.spy()
    const fn = requestGrouper({
      delay: 10,
      requester: MockRequester(spy)
    })

    fn('input1').then(res => res.should.equal(mockRequesterSingleSync('input1')))
    fn('input2').then(res => res.should.equal(mockRequesterSingleSync('input2')))

    const late = () => {
      fn('input3')
      .then(res => {
        res.should.equal(mockRequesterSingleSync('input3'))
        spy.callCount.should.equal(2)
        done()
      })
    }

    setTimeout(late, 11)
  })
})

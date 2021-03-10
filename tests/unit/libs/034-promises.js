const { props, tap, wait, map } = require('lib/promises')
const { undesiredRes } = require('../utils')

const should = require('should')

describe('promises utils', () => {
  describe('props', () => {
    it('should be a function', () => {
      props.should.be.a.Function()
    })

    it('should return the resolved promise in an object', async () => {
      const { a, b } = await props({
        a: 123,
        b: Promise.resolve(456)
      })
      a.should.equal(123)
      b.should.equal(456)
    })

    it('should return a rejected promise if one of the promises fail', done => {
      props({
        a: 123,
        b: Promise.reject(new Error('foo'))
      })
      .then(undesiredRes(done))
      .catch(err => {
        err.message.should.equal('foo')
        done()
      })
      .catch(done)
    })

    it('should return direct values in an object', async () => {
      const { a, b } = await props({ a: 1, b: 2 })
      a.should.equal(1)
      b.should.equal(2)
    })
  })

  describe('tap', () => {
    it('should return the previous result', done => {
      Promise.resolve(123)
      .then(tap(() => 456))
      .then(res => {
        res.should.equal(123)
        done()
      })
      .catch(done)
    })

    it('should give access to the previous result', done => {
      Promise.resolve(123)
      .then(tap(res => {
        res.should.equal(123)
        done()
      }))
      .catch(done)
    })

    it('should wait for asynchronous functions', done => {
      const start = Date.now()
      Promise.resolve(123)
      .then(tap(async () => {
        await wait(100)
      }))
      .then(() => {
        const end = Date.now()
        should(end - start >= 100).be.true()
        done()
      })
      .catch(done)
    })
  })

  describe('map', () => {
    it('should map over the passed result', done => {
      Promise.all([ 123, 456 ])
      .then(map(num => num * 2))
      .then(res => {
        res.should.deepEqual([ 246, 912 ])
        done()
      })
      .catch(done)
    })

    it('should wait for async values', done => {
      Promise.all([ 123, 456 ])
      .then(map(async num => num * 2))
      .then(res => {
        res.should.deepEqual([ 246, 912 ])
        done()
      })
      .catch(done)
    })
  })
})

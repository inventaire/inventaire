const CONFIG = require('config')
const __ = CONFIG.universalPath
const { props, tap, wait } = __.require('lib', 'promises')
const { undesiredRes } = require('../utils')

const should = require('should')

describe('promises utils', () => {
  describe('props', () => {
    it('should be a function', () => {
      props.should.be.a.Function()
    })

    it('should return the resolved promise in an object', done => {
      props({
        a: 123,
        b: Promise.resolve(456)
      })
      .then(res => {
        res.a.should.equal(123)
        res.b.should.equal(456)
        done()
      })
      .catch(done)
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

    return it('should return direct values in an object', done => {
      props({
        a: 1,
        b: 2
      })
      .then(res => {
        res.a.should.equal(1)
        res.b.should.equal(2)
        done()
      })
      .catch(done)
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
      .then(tap(async res => {
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
})

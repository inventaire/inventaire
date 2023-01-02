import should from 'should'
import { props, tap, wait, map } from '#lib/promises'
import { shouldNotBeCalled } from '#tests/unit/utils'

describe('promises utils', () => {
  describe('props', () => {
    it('should be a function', () => {
      props.should.be.a.Function()
    })

    it('should return the resolved promise in an object', async () => {
      const { a, b } = await props({
        a: 123,
        b: Promise.resolve(456),
      })
      a.should.equal(123)
      b.should.equal(456)
    })

    it('should return a rejected promise if one of the promises fail', async () => {
      await props({
        a: 123,
        b: Promise.reject(new Error('foo')),
      })
      .then(shouldNotBeCalled)
      .catch(err => {
        err.message.should.equal('foo')
      })
    })

    it('should return direct values in an object', async () => {
      const { a, b } = await props({ a: 1, b: 2 })
      a.should.equal(1)
      b.should.equal(2)
    })
  })

  describe('tap', () => {
    it('should return the previous result', async () => {
      await Promise.resolve(123)
      .then(tap(() => 456))
      .then(res => {
        res.should.equal(123)
      })
    })

    it('should give access to the previous result', async () => {
      await Promise.resolve(123)
      .then(tap(res => {
        res.should.equal(123)
      }))
    })

    it('should wait for asynchronous functions', async () => {
      const start = Date.now()
      await Promise.resolve(123)
      .then(tap(async () => {
        await wait(100)
      }))
      .then(() => {
        const end = Date.now()
        should(end - start >= 100).be.true()
      })
    })
  })

  describe('map', () => {
    it('should map over the passed result', async () => {
      await Promise.all([ 123, 456 ])
      .then(map(num => num * 2))
      .then(res => {
        res.should.deepEqual([ 246, 912 ])
      })
    })

    it('should wait for async values', async () => {
      await Promise.all([ 123, 456 ])
      .then(map(async num => num * 2))
      .then(res => {
        res.should.deepEqual([ 246, 912 ])
      })
    })
  })
})

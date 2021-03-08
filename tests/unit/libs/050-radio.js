const CONFIG = require('config')
const __ = CONFIG.universalPath
const { wait } = require('lib/promises')
const radio = require('lib/radio')
require('should')

// Do not run without having set NODE_ENV
CONFIG.env.should.startWith('tests')

describe('radio', () => {
  describe('emit [in test environment]', () => {
    it('should return a promise', async () => {
      let waited = false
      radio.on('foo', async () => {
        await wait(100)
        waited = true
      })
      const promise = radio.emit('foo')
      promise.should.be.a.Promise()
      await promise
      waited.should.be.true()
    })

    it('should return a resolved promise, even in case of a falling promise', async () => {
      let waited = false
      radio.on('foo', async () => {
        await wait(100)
        waited = true
      })
      radio.on('foo', async () => { throw new Error('nop') })
      const promise = radio.emit('foo')
      promise.should.be.a.Promise()
      await promise
      waited.should.be.true()
    })
  })
})

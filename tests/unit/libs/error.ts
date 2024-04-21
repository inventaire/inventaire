import should from 'should'
import { newError } from '#lib/error/error'

describe('error_', () => {
  describe('new', () => {
    it('should return an Error object', () => {
      const err = newError('doh', 500)
      err.should.be.an.Object()
      should(err instanceof Error).be.true()
    })

    it('should have a message property', () => {
      const err = newError('doh', 500)
      err.message.should.equal('doh')
    })

    it('should convert a number filter into a status code', () => {
      const err = newError('doh', 456)
      err.statusCode.should.equal(456)
      should(err.type).not.be.ok()
    })

    it('should convert a string filter into an error type', () => {
      const err = newError('doh', 'pinaiz')
      err.type.should.equal('pinaiz')
      should(err.statusCode).not.be.ok()
    })
  })
})

const __ = require('config').universalPath

const should = require('should')

const error_ = require('lib/error/error')

describe('error_', () => {
  describe('new', () => {
    it('should return an Error object', () => {
      const err = error_.new('doh', 500)
      err.should.be.an.Object();
      (err instanceof Error).should.be.true()
    })

    it('should have a message property', () => {
      const err = error_.new('doh', 500)
      err.message.should.equal('doh')
    })

    it('should convert a number filter into a status code', () => {
      const err = error_.new('doh', 456)
      err.statusCode.should.equal(456)
      should(err.type).not.be.ok()
    })

    it('should convert a string filter into an error type', () => {
      const err = error_.new('doh', 'pinaiz')
      err.type.should.equal('pinaiz')
      should(err.statusCode).not.be.ok()
    })

    it('should pass following arguments as an array of context', () => {
      const err = error_.new('doh', 'pinaiz', 'pizza', 'macharoni')
      err.type.should.equal('pinaiz')
      should(err.statusCode).not.be.ok()
      err.context.should.be.an.Array()
      err.context.length.should.equal(2)
      err.context[0].should.equal('pizza')
      err.context[1].should.equal('macharoni')
    })
  })

  describe('ErrorHandler', () => {
    it('should return a function', () => {
      error_.handler.should.be.a.Function()
      error_.Handler.should.be.a.Function()
      error_.Handler('yo').should.be.a.Function()
    })
  })
})

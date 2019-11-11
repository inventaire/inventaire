// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const __ = require('config').universalPath
const _ = __.require('builders', 'utils')

const should = require('should')

const error_ = __.require('lib', 'error/error')

describe('error_', () => {
  describe('new', () => {
    it('should return an Error object', (done) => {
      const err = error_.new('doh', 500)
      err.should.be.an.Object();
      (err instanceof Error).should.be.true()
      done()
    })

    it('should have a message property', (done) => {
      const err = error_.new('doh', 500)
      err.message.should.equal('doh')
      done()
    })

    it('should convert a number filter into a status code', (done) => {
      const err = error_.new('doh', 456)
      err.statusCode.should.equal(456)
      should(err.type).not.be.ok()
      done()
    })

    it('should convert a string filter into an error type', (done) => {
      const err = error_.new('doh', 'pinaiz')
      err.type.should.equal('pinaiz')
      should(err.statusCode).not.be.ok()
      done()
    })

    it('should pass following arguments as an array of context', (done) => {
      const err = error_.new('doh', 'pinaiz', 'pizza', 'macharoni')
      err.type.should.equal('pinaiz')
      should(err.statusCode).not.be.ok()
      err.context.should.be.an.Array()
      err.context.length.should.equal(2)
      err.context[0].should.equal('pizza')
      err.context[1].should.equal('macharoni')
      done()
    })
  })

  describe('ErrorHandler', () => it('should return a function', (done) => {
    error_.handler.should.be.a.Function()
    error_.Handler.should.be.a.Function()
    error_.Handler('yo').should.be.a.Function()
    done()
  }))

  return describe('reject', () => {
    it('should return a rejecting promise from a string', (done) => {
      const failed = error_.reject('doh', 500)
      failed.should.be.an.Object()
      failed.then.should.be.a.Function()
      failed.catch((err) => {
        err.message.should.equal('doh')
        err.statusCode.should.equal(500)
        done()
      })

    })

    it('should return a rejecting promise from an error object', (done) => {
      error_.reject(new Error('doh'), 500)
      .catch((err) => {
        err.message.should.equal('doh')
        done()
      })

    })
  })
})

// TODO: This file was created by bulk-decaffeinate.
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const CONFIG = require('config')
const __ = CONFIG.universalPath
const _ = __.require('builders', 'utils')
const should = require('should')

const { validateValueType } = __.require('controllers', 'entities/lib/properties/validations')

describe('properties', () => describe('validateValueType', () => {
  it('should return false when passed the wrong type', (done) => {
    validateValueType('wdt:P50', 123).should.be.false()
    validateValueType('wdt:P212', null).should.be.false()
    return done()
  })

  return it('should return true when passed the right type', (done) => {
    validateValueType('wdt:P50', 'not a qid but a proper string').should.be.true()
    validateValueType('wdt:P212', 'not an isbn but a proper string').should.be.true()
    return done()
  })
}))
